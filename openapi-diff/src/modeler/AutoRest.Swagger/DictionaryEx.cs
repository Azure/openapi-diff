using System.Collections.Generic;

namespace AutoRest.Swagger
{
    static class DictionaryEx
    {
        public static IDictionary<K, T> AddIfNotNull<K, T>(this IDictionary<K, T> map, K k, T v)
        {
            if (v != null)
            {
                map[k] = v;
            }
            return map;
        }
    }
}
