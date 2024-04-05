using Microsoft.AspNetCore.Components;
using Newtonsoft.Json;

namespace BlackTower.Pages;

public partial class CharacterSheetStatic
{
	private const string _hpString         = "HP";
	private const string _mpString         = "MP";
	private const string _strengthString   = "STR";
	private const string _magicString      = "MAG";
	private const string _defenseString    = "DEF";
	private const string _resistanceString = "RES";

	[Parameter]
	public string CharacterName
	{
		get => _characterName;
		set {
			if (this._characterName == value) return;

			this._characterName = value;
			this.Character = LoadCharacter(this._characterName) ?? Character.DefaultCharacter;
		}
	}
	public Character Character { get; private set; } = Character.DefaultCharacter;

	private string _characterName = "";

	private string ClassHP  => GetSignClass(this.Character.SpecialtyClass.BaseHP);
	private string ClassMP  => GetSignClass(this.Character.SpecialtyClass.BaseMP);
	private string ClassStr => GetSignClass(this.Character.SpecialtyClass.BaseStrength);
	private string ClassMag => GetSignClass(this.Character.SpecialtyClass.BaseMagic);
	private string ClassDef => GetSignClass(this.Character.SpecialtyClass.BaseDefense);
	private string ClassRes => GetSignClass(this.Character.SpecialtyClass.BaseResistance);

	private static string GetSignClass(sbyte value)
	{
		return value switch
		{
			> 0 => "positive",
			< 0 => "negative",
			0   => "zero",
		};
	}

	private static string GetStatEquationString(byte baseStat, sbyte classStat, byte totalStat)
	{
		char sign = classStat switch
		{
			> 0 => '+',
			< 0 => '-',
			0   => '±',
		};

		string classStr = $"{sign}{Math.Abs(classStat)}";
		string totalStr = $"={totalStat}";

		return $"{baseStat,2}{classStr,4}{totalStr,4}";
	}

	private static Character? LoadCharacter(string name)
	{
		Character? character = JsonConvert.DeserializeObject<Character>(File.ReadAllText($"Data/Characters/{name}.json"));
		if (character != null)
			JobClass.Classes[character.SpecialtyClass.Name.ToLower()] = character.SpecialtyClass;
		return character;
	}
}
