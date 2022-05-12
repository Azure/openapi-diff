using System.Reflection;

using System.IO;
using AutoRest.Swagger.Model;
using Newtonsoft.Json;
using Xunit;
using OpenApiDiff.Core;

namespace AutoRest.Swagger.UTest
{
    /// <summary>
    /// This class contains tests about the swagger parser
    /// </summary>
    [Collection("Comparison Tests")]
    public class SwaggerParserTest
    {
        private static string ReadSwaggerFile(string fileName)
        {
            var baseDir = Directory.GetParent(typeof(SwaggerParserTest).GetTypeInfo().Assembly.Location)
                .ToString();
            var filePath = Path.Combine(baseDir, "Resource", "Swagger", fileName);
            return File.ReadAllText(filePath);
        }

        /// <summary>
        /// Verifies that the Parser throws an Exception when an in valid json is given
        /// </summary>
        [Fact]
        public void SwaggerParser_Should_Throw_Exception_When_Invalid_Json()
        {
            const string fileName = "invalid_swagger_specification.json";
            var documentAsString = ReadSwaggerFile(fileName);
            Assert.Throws<JsonReaderException>(() => SwaggerParser.Parse(documentAsString, fileName));
        }

        /// <summary>
        /// Verifies that a valid JsonDocument object is parsed when input is a valid Swagger
        /// </summary>
        [Fact]
        public void SwaggerParser_Should_Return_Valid_Swagger_Document_Object()
        {
            const string fileName = "swagger_specification.json";
            var documentAsString = ReadSwaggerFile(fileName);
            var validSwaggerDocument = SwaggerParser.Parse(documentAsString, fileName);
            Assert.IsType<JsonDocument<ServiceDefinition>>(validSwaggerDocument);
        }
    }
}