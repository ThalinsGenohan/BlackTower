namespace BlackTower.Pages;

public partial class CharacterSheetRun
{
	private const string HPString         = "HP";
	private const string MPString         = "MP";
	private const string StrengthString   = "STR";
	private const string MagicString      = "MAG";
	private const string DefenseString    = "DEF";
	private const string ResistanceString = "RES";

	public Character Character { get; set; } = Character.AlaynaExample;

	private string ClassHP  => GetSignClass(this.Character.SpecialtyClass.BaseHP);
	private string ClassMP  => GetSignClass(this.Character.SpecialtyClass.BaseMP);
	private string ClassSTR => GetSignClass(this.Character.SpecialtyClass.BaseStrength);
	private string ClassMAG => GetSignClass(this.Character.SpecialtyClass.BaseMagic);
	private string ClassDEF => GetSignClass(this.Character.SpecialtyClass.BaseDefense);
	private string ClassRES => GetSignClass(this.Character.SpecialtyClass.BaseResistance);

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
