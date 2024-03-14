namespace BlackTower;

public class PronounList
{
	public string Subject           { get; set; } = "they";
	public string Object            { get; set; } = "them";
	public string PossessiveSubject { get; set; } = "their";
	public string PossessiveObject  { get; set; } = "theirs";
	public string Reflexive         { get; set; } = "themself";

	public string StringShort => $"{this.Subject}/{this.Object}";

	public string StringFull =>
		$"{this.Subject}/{this.Object}/{this.PossessiveSubject}/{this.PossessiveObject}/{this.Reflexive}";
}

public class Character
{
	public const byte BaseHP         = 10;
	public const byte BaseMP         = 10;
	public const byte BaseStrength   = 5;
	public const byte BaseMagic      = 5;
	public const byte BaseDefense    = 5;
	public const byte BaseResistance = 5;

	public static readonly Character DefaultCharacter = new()
	{
		Name       = "Name",
		Pronouns   = new PronounList(),
		Species    = "Species",
		PlayerName = "Player Name",
	};

	public static readonly Character AlaynaExample = new()
	{
		Name = "Ambi Sykhashar",
		Pronouns = new PronounList
		{
			Subject           = "sy",
			Object            = "syr",
			PossessiveSubject = "syn",
			PossessiveObject  = "synyr",
			Reflexive         = "syrself",
		},
		Species    = "Dragon",
		PlayerName = "Alayna",
		Biography =
			"A black and purple dragoness with golden eyes and steeped in the arcane arts. She entered the tower to study its enchantments and learn its secrets...",
		SpecialtyClass = new JobClass
		{
			Name           = "Vismaster",
			Description    = "A master of energy magic. Capable of storing energy to release it in a different form.",
			BaseHP         = 0,
			BaseMP         = 20,
			BaseStrength   = -3,
			BaseMagic      = 5,
			BaseDefense    = -2,
			BaseResistance = 3,
		},
	};

	public string      Name       { get; set; } = "";
	public PronounList Pronouns   { get; set; } = new();
	public string      Species    { get; set; } = "";
	public string      PlayerName { get; set; } = "";
	public string      Biography  { get; set; } = "";

	public ushort RunsWon           { get; set; } = 0;
	public ushort RunsPlayed        { get; set; } = 0;
	public ushort TotalLevelsGained { get; set; } = 0;

	public Weapon?    MainHandWeapon { get; set; } = null;
	public Weapon?    OffHandWeapon  { get; set; } = null;
	public Armor?     Armor          { get; set; } = null;
	public Accessory? Accessory      { get; set; } = null;

	public JobClass  SpecialtyClass { get; set; } = new();
	public JobClass? EquippedClass  { get; set; } = null;

	public byte MaxHP => (byte)(BaseHP + this.SpecialtyClass.BaseHP + (this.EquippedClass?.BaseHP ?? 0) +
	                            (this.MainHandWeapon?.HP ?? 0) + (this.OffHandWeapon?.HP ?? 0) + (this.Armor?.HP ?? 0) +
	                            (this.Accessory?.HP ?? 0));

	public byte MaxMP => (byte)(BaseMP + this.SpecialtyClass.BaseMP + (this.EquippedClass?.BaseMP ?? 0));

	public byte Strength =>
		(byte)(BaseStrength + this.SpecialtyClass.BaseStrength + (this.EquippedClass?.BaseStrength ?? 0));

	public byte Magic => (byte)(BaseMagic + this.SpecialtyClass.BaseMagic + (this.EquippedClass?.BaseMagic ?? 0));

	public byte Defense =>
		(byte)(BaseDefense + this.SpecialtyClass.BaseDefense + (this.EquippedClass?.BaseDefense ?? 0));

	public byte Resistance =>
		(byte)(BaseResistance + this.SpecialtyClass.BaseResistance + (this.EquippedClass?.BaseResistance ?? 0));
}

public class RunCharacter
{
	public Character Character { get; }

	public byte CurrentHP        { get; set; } = 0;
	public byte CurrentMP        { get; set; } = 0;
	public byte CurrentExp       { get; set; } = 0;
	public byte CurrentLevel     { get; set; } = 0;
	public byte HPBoosts         { get; set; } = 0;
	public byte MPBoosts         { get; set; } = 0;
	public byte StrengthBoosts   { get; set; } = 0;
	public byte MagicBoosts      { get; set; } = 0;
	public byte DefenseBoosts    { get; set; } = 0;
	public byte ResistanceBoosts { get; set; } = 0;

	public RunCharacter(Character character)
	{
		this.Character = character;
	}
}
