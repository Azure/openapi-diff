
namespace AutoRest.Swagger
{
    public class MessageTemplate
    {
        public MessageTemplate()
        {
        }

        public MessageTemplate(int id, string code, string message)
        {
            Code = code;
            Id = id;
            Message = message;
        }

        public int Id { get; set; }

        public string Code { get; set; }

        public string Message { get; set; }
    }
}