from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
import requests
import matplotlib.pyplot as plt
import io
import re
import os
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# ---------------------------
# Global Logging and Settings
# ---------------------------
steps_log = []  # Global list to store step logs

def log_step(step_description: str, team_member: str):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_message = f"[{timestamp}] {team_member}: {step_description}"
    print(log_message)
    steps_log.append(log_message)

# Define team assignments for each tool.
TEAM_ASSIGNMENTS = {
    "search": "WeatherFetcher",
    "graph_generation": "GraphCreator",
    "predict_weather": "ForecastAnalyst",
    "generate_report": "ReportCompiler",
    "get_news": "NewsAggregator",
    "web_search": "WebSearchAgent",
    "get_date": "DateFetcher"
}

# ---------------------------
# Initialize LLM and APIs
# ---------------------------
llm = ChatOpenAI(api_key=os.getenv("OPENAI_API_KEY"), model="gpt-4")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# ---------------------------
# Tool: Weather Data Fetcher
# ---------------------------
@tool
def search(query: str):
    """
    Get current weather for a location using OpenWeatherMap API.
    If the query contains "yesterday", compute the date and use web_search to simulate historical data.
    """
    team = TEAM_ASSIGNMENTS["search"]
    
    if "yesterday" in query.lower():
        yesterday_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        # Clean query to extract location (assumes format "weather yesterday in <location>")
        location = query.lower().replace("yesterday", "").replace("weather in", "").strip()
        log_step(f"Manager assigned historical weather retrieval for {location} on {yesterday_date}.", "Manager")
        historical_result = web_search.invoke({"query": f"Historical weather data for {location} on {yesterday_date}"})
        # Return the simulated historical data directly.
        return f"Historical weather for {location} on {yesterday_date}: {historical_result}"
    
    log_step("Let's fetch the current weather data for you.", team)
    if "weather in " in query.lower():
        location = query.lower().split("weather in ")[-1].strip()
    else:
        location = query.strip()

    OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
    geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={location}&limit=1&appid={OPENWEATHERMAP_API_KEY}"
    
    try:
        geo_response = requests.get(geo_url)
        geo_data = geo_response.json()
        if not geo_data:
            log_step(f"Couldn't find the location '{location}'.", team)
            return "Location not found"
        
        lat = geo_data[0]['lat']
        lon = geo_data[0]['lon']
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHERMAP_API_KEY}&units=metric"
        weather_response = requests.get(weather_url)
        weather_data = weather_response.json()
        
        temp = weather_data['main']['temp']
        description = weather_data['weather'][0]['description']
        log_step(f"Got weather for {location}: {temp}°C, {description}.", team)
        return f"{temp}°C with {description}"
    
    except Exception as e:
        log_step(f"Error fetching weather: {str(e)}", team)
        return f"Error fetching weather: {str(e)}"

# ---------------------------
# Tool: Graph Generation
# ---------------------------
@tool
def graph_generation(query: str, graph_type: str = "line"):
    """
    Generate a temperature graph from a query.
    If no temperature values are found, simulate a data series using current weather.
    Store the graph as a PNG file.
    """
    team = TEAM_ASSIGNMENTS["graph_generation"]
    log_step(f"Generating a {graph_type} graph for you.", team)
    
    # Try to extract temperature values
    temps = list(map(float, re.findall(r'\d+\.?\d*', query)))
    if not temps:
        log_step("No temperature values found in input. Falling back to simulated data based on current weather.", "Manager")
        current_weather = search.invoke({"query": "weather in Pune"})
        match_temp = re.search(r'(\d+\.?\d*)°C', current_weather)
        if match_temp:
            base_temp = float(match_temp.group(1))
            temps = [round(base_temp + i * 0.5, 1) for i in range(-3, 4)]
        else:
            return "No temperature values found in query and unable to simulate data"
    
    try:
        plt.switch_backend('Agg')
        plt.figure(figsize=(10, 5))
        if graph_type == "line":
            plt.plot(temps, marker='o', linestyle='-', color='r')
            plt.title('Temperature Trend')
        elif graph_type == "bar":
            plt.bar(range(len(temps)), temps, color='b')
            plt.title('Temperature Bar Chart')
        elif graph_type == "scatter":
            plt.scatter(range(len(temps)), temps, color='g')
            plt.title('Temperature Scatter Plot')
        elif graph_type == "pie":
            plt.pie(temps, labels=[f'Temp {i+1}' for i in range(len(temps))], autopct='%1.1f%%')
            plt.title('Temperature Distribution')
        elif graph_type == "heatmap":
            data = pd.DataFrame({'Temperature': temps})
            plt.imshow(data, cmap='hot', interpolation='nearest')
            plt.title('Temperature Heatmap')
        else:
            log_step(f"Unsupported graph type: {graph_type}.", team)
            return f"Unsupported graph type: {graph_type}"
    
        plt.xlabel('Time (hours)')
        plt.ylabel('Temperature (°C)')
        plt.grid(True)
    
        os.makedirs('analysis', exist_ok=True)
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        filename = os.path.join('analysis', f'temperature_plot_{graph_type}.png')
        with open(filename, 'wb') as f:
            f.write(buf.read())
        plt.close()
    
        log_step(f"Your {graph_type} graph is ready and saved as {filename}.", team)
        return f"Temperature {graph_type} graph saved to {filename}"
    except Exception as e:
        log_step(f"Error generating {graph_type} graph: {str(e)}", team)
        return f"Error generating image: {str(e)}"

# ---------------------------
# Tool: Weather Predictions
# ---------------------------
@tool
def predict_weather(query: str):
    """
    Generate weather predictions for the next 7 days based on extracted or simulated temperature values.
    """
    team = TEAM_ASSIGNMENTS["predict_weather"]
    log_step("Calculating predictions for the upcoming week.", team)
    
    temps = list(map(float, re.findall(r'\d+\.?\d*', query)))
    if not temps:
        current_weather = search.invoke({"query": "weather in Pune"})
        match_temp = re.search(r'(\d+\.?\d*)°C', current_weather)
        if match_temp:
            base_temp = float(match_temp.group(1))
            temps = [round(base_temp + i * 0.5, 1) for i in range(-3, 4)]
        else:
            log_step("No temperature values found for prediction.", team)
            return "No temperature values found in query for predictions."
    
    try:
        avg_temp = sum(temps) / len(temps)
        predictions = [round(avg_temp + (i - 3) * 0.5, 1) for i in range(7)]
        log_step(f"Predictions: {predictions}.", team)
        return f"Predictions for the next 7 days: {predictions}"
    except Exception as e:
        log_step(f"Error generating predictions: {str(e)}", team)
        return f"Error generating predictions: {str(e)}"

# ---------------------------
# Tool: Report Generation
# ---------------------------
@tool
def generate_report(query: str):
    """
    Generate a markdown report including:
      - Graphs (line, bar, scatter, pie, heatmap)
      - Weather predictions for the next 7 days
      - A log of tool actions and team assignments.
    Save the report as report.md.
    """
    team = TEAM_ASSIGNMENTS["generate_report"]
    log_step("Compiling a detailed report.", team)
    
    try:
        os.makedirs('analysis', exist_ok=True)
        graph_types = ['line', 'bar', 'scatter', 'pie', 'heatmap']
        graph_outputs = []
        for graph_type in graph_types:
            result = graph_generation.invoke({"query": query, "graph_type": graph_type})
            graph_outputs.append((graph_type, result))
    
        predictions_text = predict_weather.invoke({"query": query})
        current_weather = search.invoke({"query": "weather in Pune"})
    
        report_content = f"""# Weather Analysis Report

**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

**Location:** Pune

---

## 1. Current Weather Summary
- {current_weather}

---

## 2. Temperature Graphs
"""
        for graph_type, output in graph_outputs:
            match = re.search(r'(analysis[\\/]+temperature_plot_\w+\.png)', output)
            if match:
                filename = match.group(1)
                report_content += f"\n### {graph_type.capitalize()} Graph\n![]({filename})\n"
            else:
                report_content += f"\n### {graph_type.capitalize()} Graph\n*Graph generation failed: {output}*\n"
    
        report_content += f"""

---

## 3. Weather Predictions (Next 7 Days)
{predictions_text}

---

## 4. Detailed Steps Taken
"""
        for log_entry in steps_log:
            report_content += f"- {log_entry}\n"
    
        report_content += f"""

---

## 5. Team Assignments
"""
        for tool_name, member in TEAM_ASSIGNMENTS.items():
            report_content += f"- **{member}**: Responsible for `{tool_name}`\n"
    
        report_filename = os.path.join('analysis', 'report.md')
        with open(report_filename, 'w') as f:
            f.write(report_content)
    
        log_step(f"Report saved as {report_filename}.", team)
        return f"Comprehensive weather report generated and saved to {report_filename}"
    except Exception as e:
        log_step(f"Error generating report: {str(e)}", team)
        return f"Error generating report: {str(e)}"

# ---------------------------
# Tool: News Fetcher
# ---------------------------
@tool
def get_news(query: str):
    """
    Get the latest news about a topic using NewsAPI.
    Falls back to web search if no articles are found.
    """
    team = TEAM_ASSIGNMENTS["get_news"]
    log_step("Fetching the latest news.", team)
    
    try:
        url = f"https://newsapi.org/v2/everything?q={query}&apiKey={NEWS_API_KEY}&language=en&sortBy=publishedAt"
        response = requests.get(url)
        if response.status_code == 200:
            news_data = response.json()
            articles = news_data.get('articles', [])
            if articles:
                titles = "; ".join([a['title'] for a in articles[:4]])
                log_step(f"News from NewsAPI: {titles}", team)
                return f"Latest News about {query}: {titles}"
            else:
                log_step("No articles from NewsAPI; using web search.", team)
                fallback = web_search.invoke({"query": f"news {query}"})
                return f"Latest News about {query}: {fallback}"
        else:
            log_step(f"NewsAPI error: HTTP {response.status_code}", team)
            return f"Error fetching news: {response.status_code}"
    except Exception as e:
        log_step(f"Error fetching news: {str(e)}", team)
        return f"Error fetching news: {str(e)}"

# ---------------------------
# Tool: Web Search
# ---------------------------
@tool
def web_search(query: str):
    """Perform a web search (simulated)."""
    team = TEAM_ASSIGNMENTS["web_search"]
    log_step(f"Searching the web for: {query}", team)
    simulated_results = f"Simulated search results for '{query}'."
    log_step(f"Web search results: {simulated_results}", team)
    return simulated_results

# ---------------------------
# Tool: Get Current Date
# ---------------------------
@tool
def get_current_date(query: str):
    """Return the current date and time."""
    team = TEAM_ASSIGNMENTS["get_date"]
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_step(f"Current date/time: {current_date}", team)
    return current_date

# ---------------------------
# Aggregator: Final Data Analysis
# ---------------------------
def aggregate_responses(conversation_history):
    """
    Before giving the final answer, have the manager LLM analyze the conversation history 
    and tool responses to ensure all useful data is accounted for.
    """
    prompt = "Please analyze the following conversation history and tool outputs. " \
             "Evaluate whether the provided data is complete and useful. " \
             "Then, produce a final consolidated answer that incorporates all relevant information:\n\n"
    for message in conversation_history:
        prompt += f"{message['role']}: {message['content']}\n"
    final_analysis = manager_llm.invoke([{"role": "system", "content": prompt}],
                                        config={"configurable": {"thread_id": 42}})
    return final_analysis.content

# ---------------------------
# Define the tools for the agent to use
# ---------------------------
tools = [search, graph_generation, predict_weather, generate_report, get_news, web_search, get_current_date]

# ---------------------------
# Initialize memory and create the agent
# ---------------------------
checkpointer = MemorySaver()
manager_llm = ChatOpenAI(api_key=os.getenv("OPENROUTER_API_KEY"),base_url="https://openrouter.ai/api/v1", model="deepseek/deepseek-r1-distill-qwen-32b")
app = create_react_agent(llm, tools, checkpointer=checkpointer)

# Save the agent's workflow/graph image for visualization.
image_data = app.get_graph().draw_mermaid_png()
with open('agent_graph.png', 'wb') as f:
    f.write(image_data)

# ---------------------------
# Main Execution: Conversational Loop with Aggregation
# ---------------------------
if __name__ == "__main__":
    print("Hi there! I'm your interactive weather analysis assistant.")
    print("I can help analyze weather data, generate various charts, compile detailed reports, fetch news, and even perform web searches.")
    print("I'm a Smart Agent equipped with these capabilities. Feel free to ask about current weather, historical data (e.g., 'weather yesterday'), or request a detailed report.\n")
    
    conversation_history = [{
        "role": "system",
        "content": (
            "You are a Smart Agent. You can analyze weather data, generate graphs, predict weather, compile detailed reports, fetch news, "
            "perform web searches, and provide the current date/time. Always consider the latest data before responding."
        )
    }]
    
    initial_input = input("User: ")
    conversation_history.append({"role": "user", "content": initial_input})
    
    while True:
        # Manager LLM analyzes the conversation and assigns tasks.
        manager_analysis = manager_llm.invoke(
            conversation_history + [{"role": "system", "content": "Please analyze the conversation and assign tasks appropriately."}],
            config={"configurable": {"thread_id": 42}}
        )
        log_step("Manager assignment: " + manager_analysis.content, "Manager")
        
        state = app.invoke({"messages": conversation_history}, config={"configurable": {"thread_id": 42}})
        agent_response = state["messages"][-1].content
        conversation_history.append({"role": "assistant", "content": agent_response})
        
        # Aggregator: Analyze all responses before final answer.
        final_answer = aggregate_responses(conversation_history)
        print("\nFinal Aggregated Answer:", final_answer)
        
        followup = input("\nEnter any follow-up question or additional info (or just press Enter to finish): ")
        if followup.strip() == "":
            print("\nAgent: Great! Thanks for chatting. Have a wonderful day!")
            break
        else:
            conversation_history.append({"role": "user", "content": followup})
