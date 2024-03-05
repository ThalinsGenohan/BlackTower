namespace BlackTower;

public class JobClass
{
	public string Name         { get; set; } = "";
	public string Description  { get; set; } = "";
	public string ResourceName { get; set; } = "";
	public byte   ResourceMax  { get; set; } = 0;

	public sbyte BaseHP         { get; set; } = 0;
	public sbyte BaseMP         { get; set; } = 0;
	public sbyte BaseStrength   { get; set; } = 0;
	public sbyte BaseArcana     { get; set; } = 0;
	public sbyte BaseFortitude  { get; set; } = 0;
	public sbyte BaseResilience { get; set; } = 0;

	public List<Skill> Skills { get; } = new();
}
