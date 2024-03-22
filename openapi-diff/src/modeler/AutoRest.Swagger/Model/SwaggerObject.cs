// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


namespace AutoRest.Swagger.Model
{
    /// <summary>
    /// Describes a single operation determining with this object is mandatory.
    /// https://github.com/wordnik/swagger-spec/blob/master/versions/2.0.md#parameterObject
    /// </summary>
    public abstract class SwaggerObject<T> : SwaggerBase<T>
        where T: SwaggerObject<T>
    {
        public virtual bool IsRequired { get; set; }

        /// <summary>
        /// The type of the parameter.
        /// </summary>
        public virtual DataType? Type { get; set; }

        /// <summary>
        /// The extending format for the previously mentioned type.
        /// </summary>
        public virtual string Format { get; set; }

        /// <summary>
        /// Describes the type of items in the array.
        /// </summary>
        public virtual Schema Items { get; set; }

        [JsonProperty(PropertyName = "$ref")]
        public string Reference { get; set; }

        /// <summary>
        /// Describes the type of additional properties in the data type.
        /// </summary>
        public virtual Schema AdditionalProperties { get; set; }

        public virtual string Description { get; set; }

        /// <summary>
        /// Determines the format of the array if type array is used.
        /// </summary>
        public virtual string CollectionFormat { get; set; }

        /// <summary>
        /// Sets a default value to the parameter.
        /// </summary>
        public virtual dynamic Default { get; set; }

        public virtual string MultipleOf { get; set; }

        public virtual string Maximum { get; set; }

        public virtual bool ExclusiveMaximum { get; set; }

        public virtual string Minimum { get; set; }

        public virtual bool ExclusiveMinimum { get; set; }

        public virtual string MaxLength { get; set; }

        public virtual string MinLength { get; set; }

        public virtual string Pattern { get; set; }

        public virtual string MaxItems { get; set; }

        public virtual string MinItems { get; set; }

        public virtual bool UniqueItems { get; set; }

        public virtual IList<string> Enum { get; set; }

        [JsonProperty(PropertyName = "x-ms-enum")]
        public virtual XmsEnumExtension XmsEnum {get;set;}

        [JsonProperty(PropertyName = "x-ms-client-name")]
        public virtual string XmsClientName { get; set; }

        /// <summary>
        /// Compare a modified document node (this) to a previous one and look for breaking as well as non-breaking changes.
        /// </summary>
        /// <param name="context">The modified document context.</param>
        /// <param name="previous">The original document model.</param>
        /// <returns>A list of messages from the comparison.</returns>
        public override IEnumerable<ComparisonMessage> Compare(
            ComparisonContext<ServiceDefinition> context,
            T previous
        )
        {

            var prior = previous;

            if (prior == null)
            {
                throw new ArgumentNullException("priorVersion");
            }
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            base.Compare(context, previous);

            var thisModelName = this.XmsClientName ?? Reference ?? "";
            var priorModelName = previous.XmsClientName ?? previous.Reference ?? "";
            if (!thisModelName.Equals(priorModelName))
            {
                context.LogBreakingChange(ComparisonMessages.ReferenceRedirection);
            }

            if (IsRequired != prior.IsRequired)
            {
                if (context.Direction != DataDirection.Response)
                {
                    if (IsRequired && !prior.IsRequired)
                    {
                        context.LogBreakingChange(ComparisonMessages.RequiredStatusChange, prior.IsRequired, IsRequired);
                    }
                    else
                    {
                        context.LogInfo(ComparisonMessages.RequiredStatusChange, prior.IsRequired, IsRequired);
                    }
                }
            }

            // Are the types the same?

            if ((Type.HasValue && prior.Type.HasValue && prior.Type.Value != Type.Value))
            {
                context.LogError(ComparisonMessages.TypeChanged,
                    Type.HasValue ? Type.Value.ToString().ToLower() : "",
                    prior.Type.HasValue ? prior.Type.Value.ToString().ToLower() : "");
            }
            var isObject = Type.HasValue && Type.Value == DataType.Object && (this is Schema) ? (this as Schema).Properties != null : false;
            if (prior.Type.HasValue != Type.HasValue) {
                if (!prior.Type.HasValue && Type.HasValue && isObject)
                {
                    context.LogInfo(ComparisonMessages.TypeChanged,
                   Type.HasValue ? Type.Value.ToString().ToLower() : "",
                   prior.Type.HasValue ? prior.Type.Value.ToString().ToLower() : "");
                }
                else {
                    context.LogError(ComparisonMessages.TypeChanged,
                   Type.HasValue ? Type.Value.ToString().ToLower() : "",
                   prior.Type.HasValue ? prior.Type.Value.ToString().ToLower() : "");
                }
            }

            // What about the formats?

            CompareFormats(context, prior);

            CompareItems(context, prior);

            if ((Default != null || prior.Default != null) && !JToken.DeepEquals(Default,prior.Default))
            {
                context.LogBreakingChange(ComparisonMessages.DefaultValueChanged);
            }

            if (Type.HasValue && Type.Value == DataType.Array && prior.CollectionFormat != CollectionFormat)
            {
                context.LogBreakingChange(ComparisonMessages.ArrayCollectionFormatChanged);
            }

            CompareConstraints(context, prior);

            CompareProperties(context, prior);

            CompareEnums(context, prior);

            return context.Messages;
        }

        private void CompareEnums(ComparisonContext<ServiceDefinition> context, T prior)
        {
            if (prior.Enum == null && this.Enum == null) return;

            CompareXmsEnum(context,prior);
            bool relaxes = (prior.Enum != null && this.Enum == null);
            bool constrains = (prior.Enum == null && this.Enum != null);
            if (!relaxes && !constrains)
            {
                // It was enum and it is still enum i.e check for addition/removal

                // 1. Look for removed elements (constraining).
                constrains = prior.Enum.Any(str => !this.Enum.Contains(str));

                // 2. Look for added elements (relaxing).
                relaxes = this.Enum.Any(str => !prior.Enum.Contains(str));


                if (constrains)
                {
                    IEnumerable<string> removedEnums = prior.Enum.Except(this.Enum);
                    if (removedEnums.Any())
                    {
                        context.LogBreakingChange(ComparisonMessages.RemovedEnumValue, String.Join(", ", removedEnums.ToList()));
                    }
                }

                if (relaxes)
                {
                    IEnumerable<string> addedEnums = this.Enum.Except(prior.Enum);
                    if (addedEnums.Any())
                    {
                        context.LogBreakingChange(ComparisonMessages.AddedEnumValue, String.Join(", ", addedEnums.ToList()));
                    }
                }
            }
        }

        private void CompareXmsEnum(ComparisonContext<ServiceDefinition> context, T prior) {

            if (this.XmsEnum == null && prior.XmsEnum != null)
            {
                context.LogError(ComparisonMessages.RemovedXmsEnum);
            }
            if (this.XmsEnum != null && prior.XmsEnum == null)
            {
                context.LogError(ComparisonMessages.AddedXmsEnum);
            }
            if (this.XmsEnum != null && prior.XmsEnum != null &&
                !String.Equals(prior.XmsEnum.Name, this.XmsEnum.Name, StringComparison.Ordinal))
            {
                context.LogError(ComparisonMessages.XmsEnumChanged, "name");
            }
            if (this.XmsEnum != null && prior.XmsEnum != null && this.XmsEnum.ModelAsString != prior.XmsEnum.ModelAsString)
            {
                context.LogError(ComparisonMessages.XmsEnumChanged, "modelAsString");
            }
        }

        private void CompareProperties(ComparisonContext<ServiceDefinition> context, T prior)
        {
            // Additional properties

            if (prior.AdditionalProperties == null && AdditionalProperties != null)
            {
                context.LogBreakingChange(ComparisonMessages.AddedAdditionalProperties);
            }
            else if (prior.AdditionalProperties != null && AdditionalProperties == null)
            {
                context.LogBreakingChange(ComparisonMessages.RemovedAdditionalProperties);
            }
            else if (AdditionalProperties != null)
            {
                context.PushProperty("additionalProperties");
                AdditionalProperties.Compare(context, prior.AdditionalProperties);
                context.Pop();
            }
        }

        private Boolean isFormatChangeAllowed(ComparisonContext<ServiceDefinition> context, T prior) {
            if (this.Type.Equals(DataType.Integer) && !context.Strict && prior.Format != null && this.Format != null) {
                if (context.Direction == DataDirection.Request && prior.Format.Equals("int32") && this.Format.Equals("int64")) {
                    return true;
                }
                if (context.Direction == DataDirection.Response && prior.Format.Equals("int64") && this.Format.Equals("int32"))
                {
                    return true;
                }
            }
            return false;
        }

        protected void CompareFormats(ComparisonContext<ServiceDefinition> context, T prior)
        {
            if (prior == null)
            {
                throw new ArgumentNullException("prior");
            }
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            if (prior.Format == null && Format != null ||
                prior.Format != null && Format == null ||
                prior.Format != null && Format != null && !prior.Format.Equals(Format) && !isFormatChangeAllowed(context,prior))
            {
                context.LogBreakingChange(ComparisonMessages.TypeFormatChanged, Format, prior);
            }
        }

        [SuppressMessage("Microsoft.Maintainability", "CA1502:AvoidExcessiveComplexity", Justification = "It may look complex, but it really isn't.")]
        protected void CompareConstraints(ComparisonContext<ServiceDefinition> context, T prior)
        {
            if (prior == null)
            {
                throw new ArgumentNullException("prior");
            }
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            if ((prior.MultipleOf == null && MultipleOf != null) ||
                (prior.MultipleOf != null && !prior.MultipleOf.Equals(MultipleOf)))
            {
                context.LogBreakingChange(ComparisonMessages.ConstraintChanged, "multipleOf");
            }
            if ((prior.Maximum == null && Maximum != null) ||
                (prior.Maximum != null && !prior.Maximum.Equals(Maximum)) ||
                prior.ExclusiveMaximum != ExclusiveMaximum)
            {
                // Flag stricter constraints for requests and relaxed constraints for responses.
                if (prior.ExclusiveMaximum != ExclusiveMaximum || context.Direction == DataDirection.None)
                    context.LogBreakingChange(ComparisonMessages.ConstraintChanged, "maximum");
                else if (context.Direction == DataDirection.Request && Narrows(prior.Maximum, Maximum, false))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsStronger, "maximum");
                else if (context.Direction == DataDirection.Response && Widens(prior.Maximum, Maximum, false))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsWeaker, "maximum");
                else if (Narrows(prior.Maximum, Maximum, false))
                    context.LogInfo(ComparisonMessages.ConstraintIsStronger, "maximum");
                else if (Widens(prior.Maximum, Maximum, false))
                    context.LogInfo(ComparisonMessages.ConstraintIsWeaker, "maximum");
            }
            if ((prior.Minimum == null && Minimum != null) ||
                (prior.Minimum != null && !prior.Minimum.Equals(Minimum)) ||
                prior.ExclusiveMinimum != ExclusiveMinimum)
            {
                // Flag stricter constraints for requests and relaxed constraints for responses.
                if (prior.ExclusiveMinimum != ExclusiveMinimum || context.Direction == DataDirection.None)
                    context.LogBreakingChange(ComparisonMessages.ConstraintChanged, "minimum");
                else if (context.Direction == DataDirection.Request && Narrows(prior.Minimum, Minimum, true))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsStronger, "minimum");
                else if (context.Direction == DataDirection.Response && Widens(prior.Minimum, Minimum, true))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsWeaker, "minimum");
                else if (Narrows(prior.Minimum, Minimum, true))
                    context.LogInfo(ComparisonMessages.ConstraintIsStronger, "minimum");
                else if (Widens(prior.Minimum, Minimum, true))
                    context.LogInfo(ComparisonMessages.ConstraintIsWeaker, "minimum");
            }
            if ((prior.MaxLength == null && MaxLength != null) ||
                (prior.MaxLength != null && !prior.MaxLength.Equals(MaxLength)))
            {
                // Flag stricter constraints for requests and relaxed constraints for responses.
                if (context.Direction == DataDirection.None)
                    context.LogBreakingChange(ComparisonMessages.ConstraintChanged, "maxLength");
                else if (context.Direction == DataDirection.Request && Narrows(prior.MaxLength, MaxLength, false))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsStronger, "maxLength");
                else if (context.Direction == DataDirection.Response && Widens(prior.MaxLength, MaxLength, false))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsWeaker, "maxLength");
                else if (Narrows(prior.MaxLength, MaxLength, false))
                    context.LogInfo(ComparisonMessages.ConstraintIsStronger, "maxLength");
                else if (Widens(prior.MaxLength, MaxLength, false))
                    context.LogInfo(ComparisonMessages.ConstraintIsWeaker, "maxLength");
            }
            if ((prior.MinLength == null && MinLength != null) ||
                (prior.MinLength != null && !prior.MinLength.Equals(MinLength)))
            {
                // Flag stricter constraints for requests and relaxed constraints for responses.
                if (context.Direction == DataDirection.None)
                    context.LogBreakingChange(ComparisonMessages.ConstraintChanged, "minLength");
                else if (context.Direction == DataDirection.Request && Narrows(prior.MinLength, MinLength, true))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsStronger, "minimum");
                else if (context.Direction == DataDirection.Response && Widens(prior.MinLength, MinLength, true))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsWeaker, "minimum");
                else if (Narrows(prior.MinLength, MinLength, true))
                    context.LogInfo(ComparisonMessages.ConstraintIsStronger, "minLength");
                else if (Widens(prior.MinLength, MinLength, true))
                    context.LogInfo(ComparisonMessages.ConstraintIsWeaker, "minLength");
            }
            if ((prior.Pattern == null && Pattern != null) ||
                (prior.Pattern != null && !prior.Pattern.Equals(Pattern)))
            {
                context.LogBreakingChange(ComparisonMessages.ConstraintChanged, "pattern");
            }
            if ((prior.MaxItems == null && MaxItems != null) ||
                (prior.MaxItems != null && !prior.MaxItems.Equals(MaxItems)))
            {
                // Flag stricter constraints for requests and relaxed constraints for responses.
                if (context.Direction == DataDirection.None)
                    context.LogBreakingChange(ComparisonMessages.ConstraintChanged, "maxItems");
                else if (context.Direction == DataDirection.Request && Narrows(prior.MaxItems, MaxItems, false))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsStronger, "maxItems");
                else if (context.Direction == DataDirection.Response && Widens(prior.MaxItems, MaxItems, false))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsWeaker, "maxItems");
                else if (Narrows(prior.MaxItems, MaxItems, false))
                    context.LogInfo(ComparisonMessages.ConstraintIsStronger, "maxItems");
                else if (Widens(prior.MaxItems, MaxItems, false))
                    context.LogInfo(ComparisonMessages.ConstraintIsWeaker, "maxItems");
            }
            if ((prior.MinItems == null && MinItems != null) ||
                (prior.MinItems != null && !prior.MinItems.Equals(MinItems)))
            {
                // Flag stricter constraints for requests and relaxed constraints for responses.
                if (context.Direction == DataDirection.None)
                    context.LogBreakingChange(ComparisonMessages.ConstraintChanged, "minItems");
                else if (context.Direction == DataDirection.Request && Narrows(prior.MinItems, MinItems, true))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsStronger, "minItems");
                else if (context.Direction == DataDirection.Response && Widens(prior.MinItems, MinItems, true))
                    context.LogBreakingChange(ComparisonMessages.ConstraintIsWeaker, "minItems");
                else if (Narrows(prior.MinItems, MinItems, true))
                    context.LogInfo(ComparisonMessages.ConstraintIsStronger, "minItems");
                else if (Widens(prior.MinItems, MinItems, true))
                    context.LogInfo(ComparisonMessages.ConstraintIsWeaker, "minItems");
            }
            if (prior.UniqueItems != UniqueItems)
            {
                context.LogBreakingChange(ComparisonMessages.ConstraintChanged, "uniqueItems");
            }
        }

        private bool Narrows(string previous, string current, bool isLowerBound)
        {
            int p = 0;
            int c = 0;
            return int.TryParse(previous, out p) &&
                   int.TryParse(current, out c) &&
                   (isLowerBound ? (c > p) : (c < p));
        }

        private bool Widens(string previous, string current, bool isLowerBound)
        {
            int p = 0;
            int c = 0;
            return int.TryParse(previous, out p) &&
                   int.TryParse(current, out c) &&
                   (isLowerBound ? (c < p) : (c > p));
        }

        protected void CompareItems(ComparisonContext<ServiceDefinition> context, T prior)
        {
            if (prior == null)
            {
                throw new ArgumentNullException("prior");
            }
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }

            if (prior.Items != null && Items != null)
            {
                context.PushProperty("items");
                Items.Compare(context, prior.Items);
                context.Pop();
            }
        }
    }
}