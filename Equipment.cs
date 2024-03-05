namespace BlackTower;

public class Equipment
{
	public string Name        { get; set; } = "";
	public string Description { get; set; } = "";

	public sbyte HP         { get; set; } = 0;
	public sbyte MP         { get; set; } = 0;
	public sbyte Strength   { get; set; } = 0;
	public sbyte Arcana     { get; set; } = 0;
	public sbyte Fortitude  { get; set; } = 0;
	public sbyte Resilience { get; set; } = 0;
}

public class Accessory : Equipment
{

}

public class Armor : Equipment
{
	public byte Defense { get; set; } = 0;
}

public class Weapon : Equipment
{
	public byte AttackPower { get; set; } = 0;
	public bool IsTwoHanded { get; set; } = false;
}
