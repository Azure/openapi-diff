using Newtonsoft.Json.Linq;
using OpenApiDiff.Core;
using OpenApiDiff.Core.Logging;
using System;
using System.Collections.Generic;
using AutoRest.Swagger.Model;

namespace AutoRest.Swagger
{
    /// <summary>
    /// Provides context for a comparison, such as the ancestors in the validation tree, the root object
    ///   and information about the key or index that locate this object in the parent's list or dictionary
    /// </summary>
    public class ComparisonContext<T>
    {
        private readonly JsonDocument<T> _CurrentRootDoc;
        private readonly JsonDocument<T> _PreviousRootDoc;

        /// <summary>
        /// Initializes a top level context for comparisons
        /// </summary>
        /// <param name="oldRootDoc">an old document of type T.</param>
        /// <param name="newRootDoc">a new document of type T</param>
        public ComparisonContext(JsonDocument<T> oldRootDoc, JsonDocument<T> newRootDoc, Settings settings = null)
        {
            _CurrentRootDoc = newRootDoc;
            _PreviousRootDoc = oldRootDoc;
            
            if (settings != null)
            {
                Strict = settings.Strict;
            }
        }

        /// <summary>
        /// The original root object in the graph that is being compared
        /// </summary>
        public T CurrentRoot => _CurrentRootDoc.Typed;

        public T PreviousRoot => _PreviousRootDoc.Typed;

        /// <summary>
        /// If true, then checking should be strict, in other words, breaking changes are errors
        /// intead of warnings.
        /// </summary>
        public bool Strict { get; set; } = false;

        public DataDirection Direction { get; set; } = DataDirection.None;

        // public Uri File { get; }
        public ObjectPath Path => _path.Peek();

        // public void PushIndex(int index) => _path.Push(Path.AppendIndex(index));
        public void PushProperty(string property) => _path.Push(Path.AppendProperty(property));

        public void PushItemByName(string name) => _path.Push(Path.AppendItemByName(name));

        public void PushPathProperty(string name) => _path.Push(Path.AppendPathProperty(name));

        public void Pop() => _path.Pop();

        private Stack<ObjectPath> _path = new Stack<ObjectPath>(new[] { ObjectPath.Empty });

        public void LogInfo(MessageTemplate template, params object[] formatArguments) 
            => _messages.Add(new ComparisonMessage(
                template, 
                Path,
                _PreviousRootDoc,
                _CurrentRootDoc,
                Category.Info, 
                formatArguments
            ));

        public void LogError(MessageTemplate template, params object[] formatArguments)
            => _messages.Add(new ComparisonMessage(
                template, 
                Path,
                _PreviousRootDoc,
                _CurrentRootDoc,
                Category.Error, 
                formatArguments
            ));

        public void LogBreakingChange(MessageTemplate template, params object[] formatArguments)
            => _messages.Add(new ComparisonMessage(
                template, 
                Path,
                _PreviousRootDoc,
                _CurrentRootDoc,
                Strict ? Category.Error : Category.Warning,
                formatArguments
            ));

        public IEnumerable<ComparisonMessage> Messages
        {
            get
            {
                // TODO: How to eliminate duplicate messages
                // Issue: https://github.com/Azure/openapi-diff/issues/48
                return _messages; //.Distinct(new CustomComparer());
            }
        }

        public string PathJsonPointerInPreviousDoc => Path.JsonPointer(_PreviousRootDoc);

        public string PathJsonPointerInCurrentDoc => Path.JsonPointer(_CurrentRootDoc);

        private IList<ComparisonMessage> _messages = new List<ComparisonMessage>();
    }

    public enum DataDirection
    {
        None = 0,
        Request = 1,
        Response = 2,
        Both = 3
    }
}