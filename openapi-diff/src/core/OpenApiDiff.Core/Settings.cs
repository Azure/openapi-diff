// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using Newtonsoft.Json.Linq;
using OpenApiDiff.Core.Properties;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;

namespace OpenApiDiff.Core
{
    public class Settings
    {
        private static Settings Instance = new Settings();

        // The CommandLineInfo attribute is reflected to display help.
        // Prefer to show required properties before optional.
        // Although not guaranteed by the Framework, the iteration order matches the
        // order of definition.

        #region ordered_properties

        /// <summary>
        /// Gets or sets the path to the old specification file.
        /// </summary>
        [SettingsInfo("The location of the old specification.", true)]
        [SettingsAlias("o")]
        [SettingsAlias("old")]
        public string OldSpec { get; set; }

        /// <summary>
        /// Gets or sets the path to the new specification file.
        /// </summary>
        [SettingsInfo("The location of the new specification.", true)]
        [SettingsAlias("n")]
        [SettingsAlias("new")]
        public string NewSpec { get; set; }

        /// <summary>
        /// If set to true, print out help message.
        /// </summary>
        [SettingsAlias("?")]
        [SettingsAlias("h")]
        [SettingsAlias("help")]
        public bool ShowHelp { get; set; }

        /// <summary>
        /// If set to true, collect and print out more detailed messages.
        /// </summary>
        [SettingsAlias("verbose")]
        public bool Verbose { get; set; }

        /// <summary>
        /// If true, then checking should be strict, in other words, breaking changes are errors intead of warnings.
        /// </summary>
        [SettingsInfo("If true, then checking should be strict, in other words, breaking changes are errors intead of warnings.", false)]
        [SettingsAlias("Strict")]
        public bool Strict { get; set; }
        #endregion

        /// <summary>
        /// If set to true, print out debug messages.
        /// </summary>
        [SettingsAlias("debug")]
        public bool Debug { get; set; }

        private Settings()
        {
        }

        /// <summary>
        /// Factory method to generate Settings from command line arguments.
        /// Matches dictionary keys to the settings properties.
        /// </summary>
        /// <param name="arguments">Command line arguments</param>
        /// <returns>Settings</returns>
        private static Settings Create(string[] arguments)
        {
            var argsDictionary = ParseArgs(arguments);
            if (argsDictionary.Count == 0)
            {
                argsDictionary["?"] = String.Empty;
            }

            return Create(argsDictionary);
        }

        private static Dictionary<string, object> ParseArgs(string[] arguments)
        {
            var argsDictionary = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
            if (arguments != null && arguments.Length > 0)
            {
                string key = null;
                string value = null;
                for (int i = 0; i < arguments.Length; i++)
                {
                    string argument = arguments[i] ?? String.Empty;
                    argument = argument.Trim();

                    if (argument.StartsWith("-", StringComparison.OrdinalIgnoreCase))
                    {
                        if (key != null)
                        {
                            AddArgumentToDictionary(key, value, argsDictionary);
                            value = null;
                        }
                        key = argument.TrimStart('-');
                    }
                    else
                    {
                        value = argument;
                    }
                }
                if (key != null)
                {
                    AddArgumentToDictionary(key, value, argsDictionary);
                }
            }
            return argsDictionary;
        }

        private static void AddArgumentToDictionary(string key, string value, IDictionary<string, object> argsDictionary)
        {
            value = value ?? String.Empty;
            argsDictionary[key] = value;
        }

        /// <summary>
        /// Factory method to generate Settings from a dictionary. Matches dictionary
        /// keys to the settings properties.
        /// </summary>
        /// <param name="settings">Dictionary of settings</param>
        /// <returns>Settings</returns>
        private static Settings Create(IDictionary<string, object> settings)
        {
            var toolSettings = Instance;
            if (settings == null || settings.Count == 0)
            {
                toolSettings.ShowHelp = true;
            }

            PopulateSettings(toolSettings, settings);

            return toolSettings;
        }

        /// <summary>
        /// Sets object properties from the dictionary matching keys to property names or aliases.
        /// </summary>
        /// <param name="entityToPopulate">Object to populate from dictionary.</param>
        /// <param name="settings">Dictionary of settings.Settings that are populated get removed from the dictionary.</param>
        /// <returns>Dictionary of settings that were not matched.</returns>
        private static void PopulateSettings(object entityToPopulate, IDictionary<string, object> settings)
        {
            if (entityToPopulate == null)
            {
                throw new ArgumentNullException("entityToPopulate");
            }

            if (settings != null && settings.Count > 0)
            {
                // Setting property value from dictionary
                foreach (var setting in settings.ToArray())
                {
                    PropertyInfo property = entityToPopulate.GetType().GetProperties()
                        .FirstOrDefault(p => setting.Key.Equals(p.Name, StringComparison.OrdinalIgnoreCase) ||
                                             p.GetCustomAttributes<SettingsAliasAttribute>()
                                                .Any(a => setting.Key.Equals(a.Alias, StringComparison.OrdinalIgnoreCase)));

                    if (property != null)
                    {
                        try
                        {
                            if (property.PropertyType == typeof(bool) && (setting.Value == null || String.IsNullOrEmpty(setting.Value.ToString())))
                            {
                                property.SetValue(entityToPopulate, true);
                            }
                            else if (property.PropertyType.GetTypeInfo().IsEnum)
                            {
                                property.SetValue(entityToPopulate, Enum.Parse(property.PropertyType, setting.Value.ToString(), true));
                            }
                            else if (property.PropertyType.IsArray && setting.Value.GetType() == typeof(JArray))
                            {
                                var elementType = property.PropertyType.GetElementType();
                                if (elementType == typeof(string))
                                {
                                    var stringArray = ((JArray)setting.Value).Children().
                                    Select(
                                        c => c.ToString())
                                    .ToArray();

                                    property.SetValue(entityToPopulate, stringArray);
                                }
                                else if (elementType == typeof(int))
                                {
                                    var intValues = ((JArray)setting.Value).Children().
                                         Select(c => (int)Convert.ChangeType(c, elementType, CultureInfo.InvariantCulture))
                                         .ToArray();
                                    property.SetValue(entityToPopulate, intValues);
                                }
                            }
                            else if (property.CanWrite)
                            {
                                property.SetValue(entityToPopulate,
                                    Convert.ChangeType(setting.Value, property.PropertyType, CultureInfo.InvariantCulture), null);
                            }

                            settings.Remove(setting.Key);
                        }
                        catch (Exception exception)
                        {
                            throw new ArgumentException(String.Format(CultureInfo.InvariantCulture, Resources.ParameterValueIsNotValid,
                                setting.Key, property.GetType().Name), exception);
                        }
                    }
                }
            }
        }

        public static Settings GetInstance(string[] arguments)
        {
            return Create(arguments);
        }

        public void Validate()
        {
            foreach (PropertyInfo property in (typeof(Settings)).GetProperties())
            {
                // If property value is not set - throw exception.
                var doc = property.GetCustomAttributes<SettingsInfoAttribute>().FirstOrDefault();
                if (doc != null && doc.IsRequired && property.GetValue(this) == null)
                {
                    Console.WriteLine(String.Format(Resources.ParameterValueIsMissing, property.Name));
                    throw new Exception(string.Format(Resources.ParameterValueIsMissing, property.Name));
                }
            }

            // Validate input Files
            if (!File.Exists(Instance.OldSpec))
            {
                throw new Exception(String.Format(Resources.InputMustBeAFile, "-old"));
            }

            if (!File.Exists(Instance.NewSpec))
            {
                throw new Exception(String.Format(Resources.InputMustBeAFile, "-new"));
            }
        }
    }
}
