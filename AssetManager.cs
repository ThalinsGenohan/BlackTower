using Newtonsoft.Json;

namespace BlackTower;

public static class AssetManager
{
	private static Dictionary<string, Character> _characters = new();

	public static async Task<Character?> GetCharacter(string characterName)
	{
		if (_characters.TryGetValue(characterName, out Character? value))
			return value;
		if (!File.Exists($"Data/Characters/{characterName}.json"))
			return null;

		Task<string> gettingJson = File.ReadAllTextAsync($"Data/Characters/{characterName}.json");
		Character? character = JsonConvert.DeserializeObject<Character>(await gettingJson);

		if (character != null)
		{
			_characters[characterName] = character;
			JobClass.Classes[character.SpecialtyClass.Name.ToLower()] = character.SpecialtyClass;
		}

		return character;
	}
}
