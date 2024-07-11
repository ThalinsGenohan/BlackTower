using Newtonsoft.Json;
using System.Runtime.CompilerServices;

namespace BlackTower;

public static class AssetManager
{
	private static Dictionary<string, Character> _characters = new();

	public static async Task LoadAllCharacters()
	{
		var files = Directory.GetFiles("Data/Characters/", "*.json");
		if (files.Length == 0)
			return;

		foreach (var file in files)
		{
			await LoadCharacter(file);
		}
	}	

	public static async Task<Character?> GetCharacter(string characterName)
	{
		if (_characters.TryGetValue(characterName, out Character? value))
			return value;

		await LoadAllCharacters();

		return _characters[characterName.ToLower()];
	}

	private static async Task<Character?> LoadCharacter(string filepath)
	{
		if (!File.Exists(filepath))
			return null;

		Task<string> gettingJson = File.ReadAllTextAsync(filepath);
		Character? character = JsonConvert.DeserializeObject<Character>(await gettingJson);

		if (character != null)
		{
			_characters[character.Name.ToLower()] = character;
			JobClass.Classes[character.SpecialtyClass.Name.ToLower()] = character.SpecialtyClass;
		}

		return character;
	}
}
