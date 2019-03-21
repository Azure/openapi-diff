
namespace AutoRest.Swagger
{
    public class MessageTemplate
    {
        public MessageTemplate()
        {
        }

        public MessageTemplate(int id, string code, string message, MessageType type)
        {
            Code = code;
            Id = id;
            Message = message;
            Type = type;
        }

        public int Id { get; set; }

        public string Code { get; set; }

        public string Message { get; set; }

        public MessageType Type { get; set; }
    }
}