using OpenApiDiff.Core;
using OpenApiDiff.Core.Logging;
using System;
using System.Collections.Generic;

namespace AutoRest.Swagger
{
    /// <summary>
    /// Provides context for a comparison, such as the ancestors in the validation tree, the root object
    ///   and information about the key or index that locate this object in the parent's list or dictionary
    /// </summary>
    public class ComparisonContext<T>
    {
        private readonly ParsedJson<T> _CurrentRoot;
        private readonly ParsedJson<T> _PreviousRoot; 

        /// <summary>
        /// Initializes a top level context for comparisons
        /// </summary>
        /// <param name="oldRoot"></param>
        public ComparisonContext(ParsedJson<T> oldRoot, ParsedJson<T> newRoot, Settings settings = null)
        {
            this._CurrentRoot = newRoot;
            this._PreviousRoot = oldRoot;
            
            if (settings != null)
            {
                this.Strict = settings.Strict;
            }
        }

        /// <summary>
        /// The original root object in the graph that is being compared
        /// </summary>
        public T CurrentRoot => _CurrentRoot.Typed;

        public T PreviousRoot => _PreviousRoot.Typed;

        /// <summary>
        /// If true, then checking should be strict, in other words, breaking changes are errors
        /// intead of warnings.
        /// </summary>
        public bool Strict { get; set; } = false;

        public DataDirection Direction { get; set; } = DataDirection.None;

        public Uri File { get; set; }
        public ObjectPath Path => _path.Peek();

        public void PushIndex(int index) => _path.Push(Path.AppendIndex(index));
        public void PushProperty(string property) => _path.Push(Path.AppendProperty(property));
        public void Pop() => _path.Pop();

        private Stack<ObjectPath> _path = new Stack<ObjectPath>(new[] { ObjectPath.Empty });

        public void LogInfo(MessageTemplate template, params object[] formatArguments) 
            => _messages.Add(new ComparisonMessage(
                template, 
                new FileObjectPath(File, Path),
                _CurrentRoot.GetPosition(Path),
                _PreviousRoot.GetPosition(Path),
                Category.Info, 
                formatArguments
            ));

        public void LogError(MessageTemplate template, params object[] formatArguments)
            => _messages.Add(new ComparisonMessage(
                template, 
                new FileObjectPath(File, Path),
                _CurrentRoot.GetPosition(Path),
                _PreviousRoot.GetPosition(Path),
                Category.Error, 
                formatArguments
            ));

        public void LogBreakingChange(MessageTemplate template, params object[] formatArguments)
            => _messages.Add(new ComparisonMessage(
                template, 
                new FileObjectPath(File, Path),
                _CurrentRoot.GetPosition(Path),
                _PreviousRoot.GetPosition(Path),
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