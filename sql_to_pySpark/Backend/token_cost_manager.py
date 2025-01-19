import os
import json
import logging
from decimal import Decimal
from typing import Union, List, Dict
import tiktoken

import anthropic

logger = logging.getLogger(__name__)


class TokenCostManager:
    def __init__(self):
        self.token_costs = self._load_static_costs()

    def _load_static_costs(self):
        try:
            static_costs_path = os.path.join(
                os.path.dirname(__file__), "model_prices.json"
            )
            with open(static_costs_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load static costs: {e}")
            return {}

    def count_message_tokens(self, messages: List[Dict[str, str]], model: str) -> int:
        model = model.lower()
        model = self._strip_ft_model_name(model)

        if "claude-" in model:
            logger.warning(
                "Anthropic token counting API is currently in beta. Please expect differences in costs!"
            )
            return self._get_anthropic_token_count(messages, model)

        try:
            encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            logger.warning("Model not found. Using cl100k_base encoding.")
            encoding = tiktoken.get_encoding("cl100k_base")

        if model in {
            "gpt-3.5-turbo-0613",
            "gpt-3.5-turbo-16k-0613",
            "gpt-4-0314",
            "gpt-4-32k-0314",
            "gpt-4-0613",
            "gpt-4-32k-0613",
            "gpt-4-turbo",
            "gpt-4-turbo-2024-04-09",
            "gpt-4o",
            "gpt-4o-2024-05-13",
        }:
            tokens_per_message = 3
            tokens_per_name = 1
        elif model == "gpt-3.5-turbo-0301":
            tokens_per_message = 4
            tokens_per_name = -1
        elif "gpt-3.5-turbo" in model:
            logger.warning(
                "gpt-3.5-turbo may update over time. Returning num tokens assuming gpt-3.5-turbo-0613."
            )
            return self.count_message_tokens(messages, model="gpt-3.5-turbo-0613")
        elif "gpt-4o" in model:
            logger.warning(
                "gpt-4o may update over time. Returning num tokens assuming gpt-4o-2024-05-13."
            )
            return self.count_message_tokens(messages, model="gpt-4o-2024-05-13")
        elif "gpt-4" in model:
            logger.warning(
                "gpt-4 may update over time. Returning num tokens assuming gpt-4-0613."
            )
            return self.count_message_tokens(messages, model="gpt-4-0613")
        else:
            raise ValueError(
                f"num_tokens_from_messages() is not implemented for model {model}."
            )

        num_tokens = 0
        for message in messages:
            num_tokens += tokens_per_message
            for key, value in message.items():
                num_tokens += len(encoding.encode(value))
                if key == "name":
                    num_tokens += tokens_per_name
        num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
        return num_tokens

    def count_string_tokens(self, prompt: str, model: str) -> int:
        model = model.lower()

        if "/" in model:
            model = model.split("/")[-1]

        if "claude-" in model:
            raise ValueError(
                "Anthropic does not support this method. Please use the `count_message_tokens` function for the exact counts."
            )

        try:
            encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            logger.warning("Model not found. Using cl100k_base encoding.")
            encoding = tiktoken.get_encoding("cl100k_base")

        return len(encoding.encode(prompt))

    def calculate_cost_by_tokens(
        self, num_tokens: int, model: str, token_type: str
    ) -> Decimal:
        model = model.lower()
        if model not in self.token_costs:
            raise ValueError(f"Model {model} is not implemented.")

        cost_per_token_key = (
            "input_cost_per_token" if token_type == "input" else "output_cost_per_token"
        )
        cost_per_token = self.token_costs[model][cost_per_token_key]

        return Decimal(str(cost_per_token)) * Decimal(num_tokens)

    def calculate_prompt_cost(
        self, prompt: Union[List[dict], str], model: str
    ) -> Decimal:
        model = model.lower()
        model = self._strip_ft_model_name(model)
        if model not in self.token_costs:
            raise ValueError(f"Model {model} is not implemented.")
        if not isinstance(prompt, (list, str)):
            raise TypeError(
                f"Prompt must be either a string or list of message objects but found {type(prompt)} instead."
            )

        prompt_tokens = (
            self.count_string_tokens(prompt, model)
            if isinstance(prompt, str) and "claude-" not in model
            else self.count_message_tokens(prompt, model)
        )

        return self.calculate_cost_by_tokens(prompt_tokens, model, "input")

    def calculate_completion_cost(self, completion: str, model: str) -> Decimal:
        model = self._strip_ft_model_name(model)
        if model not in self.token_costs:
            raise ValueError(f"Model {model} is not implemented.")

        if not isinstance(completion, str):
            raise TypeError(
                f"Completion must be a string but found {type(completion)} instead."
            )

        if "claude-" in model:
            completion_list = [{"role": "assistant", "content": completion}]
            completion_tokens = self.count_message_tokens(completion_list, model) - 13
        else:
            completion_tokens = self.count_string_tokens(completion, model)

        return self.calculate_cost_by_tokens(completion_tokens, model, "output")

    def calculate_all_costs_and_tokens(
        self, prompt: Union[List[dict], str], completion: str, model: str
    ) -> dict:
        prompt_cost = self.calculate_prompt_cost(prompt, model)
        completion_cost = self.calculate_completion_cost(completion, model)
        prompt_tokens = (
            self.count_string_tokens(prompt, model)
            if isinstance(prompt, str) and "claude-" not in model
            else self.count_message_tokens(prompt, model)
        )

        if "claude-" in model:
            logger.warning("Token counting is estimated for Claude models")
            completion_list = [{"role": "assistant", "content": completion}]
            completion_tokens = self.count_message_tokens(completion_list, model) - 13
        else:
            completion_tokens = self.count_string_tokens(completion, model)

        return {
            "prompt_cost": prompt_cost,
            "prompt_tokens": prompt_tokens,
            "completion_cost": completion_cost,
            "completion_tokens": completion_tokens,
        }

    async def calculate_cost(self, input_tokens, output_tokens, model_name):

        input_cost = self.calculate_cost_by_tokens(
            num_tokens=input_tokens, model=model_name, token_type="input"
        )
        output_cost = self.calculate_cost_by_tokens(
            num_tokens=output_tokens, model=model_name, token_type="output"
        )

        print(f"Cost of input tokens {input_tokens}: {input_cost}")
        print(f"Cost of output tokens {output_tokens}: {output_cost}")

        total_cost = input_cost + output_cost
        print(f"Total cost: {total_cost}")
        return total_cost, input_cost, output_cost

    @staticmethod
    def _strip_ft_model_name(model: str) -> str:
        if model.startswith("ft:gpt-3.5-turbo"):
            return "ft:gpt-3.5-turbo"
        return model

    @staticmethod
    def _get_anthropic_token_count(messages: List[Dict[str, str]], model: str) -> int:
        supported_models = [
            "claude-3-5-sonnet",
            "claude-3-5-haiku",
            "claude-3-haiku",
            "claude-3-opus",
        ]
        if not any(supported_model in model for supported_model in supported_models):
            raise ValueError(
                f"{model} is not supported in token counting (beta) API. Use the `usage` property in the response for exact counts."
            )
        try:
            return (
                anthropic.Anthropic()
                .beta.messages.count_tokens(model=model, messages=messages)
                .input_tokens
            )
        except Exception as e:
            logger.error(f"Error in Anthropic token counting: {e}")
            raise


# Usage example:
# token_manager = TokenCostManager()
# message_tokens = token_manager.count_message_tokens([{"role": "user", "content": "Hello, world!"}], "gpt-3.5-turbo")
# string_tokens = token_manager.count_string_tokens("Hello, world!", "gpt-3.5-turbo")
# cost_by_tokens = token_manager.calculate_cost_by_tokens(100, "gpt-3.5-turbo", "input")
# prompt_cost = token_manager.calculate_prompt_cost("Hello, world!", "gpt-3.5-turbo")
# completion_cost = token_manager.calculate_completion_cost("Hi there!", "gpt-3.5-turbo")
# all_costs = token_manager.calculate_all_costs_and_tokens("Hello, world!", "Hi there!", "gpt-3.5-turbo")
