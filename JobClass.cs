namespace BlackTower;

public class JobClass
{
	public static Dictionary<string, JobClass> Classes = new();

	public string Name        { get; set; } = "";
	public string Description { get; set; } = "";

	public sbyte BaseHP         { get; set; } = 0;
	public sbyte BaseMP         { get; set; } = 0;
	public sbyte BaseStrength   { get; set; } = 0;
	public sbyte BaseMagic      { get; set; } = 0;
	public sbyte BaseDefense    { get; set; } = 0;
	public sbyte BaseResistance { get; set; } = 0;

	public List<Skill> Skills { get; } = new();
}
