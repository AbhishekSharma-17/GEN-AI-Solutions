from app.settings import redis_client


class RedisMemory:

    def _generate_redis_key(
        self, user_id: str, org_id: str, context_id: str, context_type: str
    ) -> str:
        return f"user_{user_id}_org_{org_id}_{context_type}_{context_id}_dialogues"

    def store_dialogue_in_redis(
        self,
        user_id: str,
        org_id: str,
        context_id: str,
        dialogue: str,
        context_type: str,
        range: int = 5,
    ):
        redis_key = self._generate_redis_key(user_id, org_id, context_id, context_type)
        redis_client.lpush(redis_key, dialogue)
        redis_client.ltrim(redis_key, 0, range)

    def get_last_dialogues_from_redis(
        self,
        user_id: str,
        org_id: str,
        context_id: str,
        context_type: str,
        range: int = 5,
    ):
        redis_key = self._generate_redis_key(user_id, org_id, context_id, context_type)
        dialogues = redis_client.lrange(redis_key, 0, range)
        return dialogues

    def clear_history_from_redis(
        self, user_id: str, org_id: str, context_id: str, context_type: str
    ):
        redis_key = self._generate_redis_key(user_id, org_id, context_id, context_type)
        redis_client.delete(redis_key)

    def store_project_metadata(
        self, user_id: str, org_id: str, project_id: str, metadata: str
    ):
        redis_key = f"user_{user_id}_org_{org_id}_project_{project_id}_project_metadata"
        redis_client.lpush(redis_key, metadata)
        project_metadata = redis_client.ltrim(redis_key, 0, 1)
        return project_metadata

    def get_metadata(self, user_id: str, org_id: str, project_id: str):
        redis_key = f"user_{user_id}_org_{org_id}_project_{project_id}_project_metadata"
        project_metadata = redis_client.lrange(redis_key, 0, 1)
        return project_metadata
