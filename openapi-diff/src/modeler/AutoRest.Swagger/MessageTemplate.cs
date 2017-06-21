
namespace AutoRest.Swagger
{
    public class MessageTemplate
    {
        public MessageTemplate()
        {
        }

        public MessageTemplate(int id, string message)
        {
            Id = id;
            Message = message;
        }

        public int Id { get; set; }

        public string Message { get; set; }
    }
}