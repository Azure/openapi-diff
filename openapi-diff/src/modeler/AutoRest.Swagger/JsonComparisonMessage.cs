namespace AutoRest.Swagger
{
    sealed class JsonComparisonMessage
    {
        public string id;

        public string code;

        public string message;

        public JsonLocation old;

        public JsonLocation @new;

        public string type;

        public string docUrl;

        public string mode;
    }
}
