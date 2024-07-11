using System.Buffers.Text;

namespace BlackTower;

public class SessionCharacter
{
	public static readonly SessionCharacter DefaultCharacter = new(Character.DefaultCharacter);

	public Character Character { get; }

	public SessionCharacter(Character character)
	{
		this.Character = character;
	}
	public JobClass? EquippedClass { get; set; } = null;

	public uint CurrentHP { get; set; } = 0;
	public uint CurrentMP { get; set; } = 0;
	public byte MaxHP => (byte)(Character.BaseHP + this.Character.SpecialtyClass.BaseHP + (this.EquippedClass?.BaseHP ?? 0) +
								(this.Character.MainHandWeapon?.HP ?? 0) + (this.Character.OffHandWeapon?.HP ?? 0) +
								(this.Character.Armor?.HP ?? 0) + (this.Character.Accessory?.HP ?? 0));

	public byte MaxMP => (byte)(Character.BaseMP + this.Character.SpecialtyClass.BaseMP + (this.EquippedClass?.BaseMP ?? 0));

	public byte Strength =>
		(byte)(Character.BaseStrength + this.Character.SpecialtyClass.BaseStrength + (this.EquippedClass?.BaseStrength ?? 0));

	public byte Magic => (byte)(Character.BaseMagic + this.Character.SpecialtyClass.BaseMagic + (this.EquippedClass?.BaseMagic ?? 0));

	public byte Defense =>
		(byte)(Character.BaseDefense + this.Character.SpecialtyClass.BaseDefense + (this.EquippedClass?.BaseDefense ?? 0));

	public byte Resistance =>
		(byte)(Character.BaseResistance + this.Character.SpecialtyClass.BaseResistance + (this.EquippedClass?.BaseResistance ?? 0));
}
