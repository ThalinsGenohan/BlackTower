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
	public const string HPString               = "HP";
	public const string MPString               = "MP";
	public const string AttackString           = "Attack";
	public const string MagicString            = "Magic";
	public const string PhysicalDefenseString  = "Phys. Def.";
	public const string ElementalDefenseString = "Elem. Def.";

	public const byte BaseHP         = 10;
	public const byte BaseMP         = 10;
	public const byte BaseStrength   = 5;
	public const byte BaseArcana     = 5;
	public const byte BaseFortitude  = 5;
	public const byte BaseResilience = 5;

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
		Biography  = "there should be a description here, lorem ipsum, etc",
		SpecialtyClass = new JobClass
		{
			Name           = "Vismaster",
			Description    = "A master of energy magic. Capable of storing energy to release it in a different form.",
			BaseHP         = 0,
			BaseMP         = 20,
			BaseStrength   = -3,
			BaseArcana     = 5,
			BaseFortitude  = -2,
			BaseResilience = 3,
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

	public byte Arcana => (byte)(BaseArcana + this.SpecialtyClass.BaseArcana + (this.EquippedClass?.BaseArcana ?? 0));

	public byte Fortitude =>
		(byte)(BaseFortitude + this.SpecialtyClass.BaseFortitude + (this.EquippedClass?.BaseFortitude ?? 0));

	public byte Resilience =>
		(byte)(BaseResilience + this.SpecialtyClass.BaseResilience + (this.EquippedClass?.BaseResilience ?? 0));
}

public class RunCharacter
{
	public Character Character { get; }

	public byte   CurrentHP         { get; set; } = 0;
	public byte   CurrentMP         { get; set; } = 0;
	public byte   CurrentExp        { get; set; } = 0;
	public byte   CurrentLevel      { get; set; } = 0;
	public byte   HPBoosts          { get; set; } = 0;
	public byte   MPBoosts          { get; set; } = 0;
	public byte   StrengthBoosts    { get; set; } = 0;
	public byte   ArcanaBoosts      { get; set; } = 0;
	public byte   FortitudeBoosts   { get; set; } = 0;
	public byte   ResilienceBoosts  { get; set; } = 0;
	public ushort SpecialtyResource { get; set; } = 0;
	public ushort EquippedResource  { get; set; } = 0;

	public RunCharacter(Character character)
	{
		this.Character = character;
	}
}
