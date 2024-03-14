namespace BlackTower;

public class Equipment
{
	public string Name        { get; set; } = "";
	public string Description { get; set; } = "";

	public sbyte HP         { get; set; } = 0;
	public sbyte MP         { get; set; } = 0;
	public sbyte Strength   { get; set; } = 0;
	public sbyte Magic      { get; set; } = 0;
	public sbyte Defense    { get; set; } = 0;
	public sbyte Resistance { get; set; } = 0;
}

public class Accessory : Equipment { }

public class Armor : Equipment { }

public class Weapon : Equipment
{
	public byte AttackPower { get; set; } = 0;
	public bool IsTwoHanded { get; set; } = false;
}
