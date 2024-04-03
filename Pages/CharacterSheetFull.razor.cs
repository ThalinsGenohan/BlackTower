using Microsoft.AspNetCore.Components;

namespace BlackTower.Pages;

public partial class CharacterSheetFull
{
	private const string _hpString         = "HP";
	private const string _mpString         = "MP";
	private const string _strengthString   = "STR";
	private const string _magicString      = "MAG";
	private const string _defenseString    = "DEF";
	private const string _resistanceString = "RES";

	public Character Character { get; set; } = Character.AlaynaExample;

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
}
