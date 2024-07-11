using Microsoft.AspNetCore.Components;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace BlackTower.Pages;

public partial class CharacterSheetRun
{
	private const string HPString         = "HP";
	private const string MPString         = "MP";
	private const string StrengthString   = "STR";
	private const string MagicString      = "MAG";
	private const string DefenseString    = "DEF";
	private const string ResistanceString = "RES";

	public CharacterSheetRun()
	{
		DataUpdated += this.UpdateData;
	}
	~CharacterSheetRun()
	{
		DataUpdated -= this.UpdateData;
	}

	[Parameter]
	public string CharacterName
	{
		get => this._characterName;
		init
		{
			this._characterName = value;
			AssetManager.GetCharacter(this._characterName).ContinueWith((c) => {
				if (c.Result == null)
					return;

				this.SessionCharacter = new(c.Result);
				// TEMP
				this.SessionCharacter.EquippedClass = JobClass.Classes["vismaster"];
				this.InvokeAsync(this.StateHasChanged);
			});
		}
	}
	public Character Character => SessionCharacter.Character;
	public SessionCharacter SessionCharacter { get; private set; } = SessionCharacter.DefaultCharacter;

	private string _characterName = "";

	private string ClassHP => GetSignClass(this.Character.SpecialtyClass.BaseHP);
	private string ClassMP => GetSignClass(this.Character.SpecialtyClass.BaseMP);
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
			0 => "zero",
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

	public static event EventHandler DataUpdated;

	private void UpdateHP(ChangeEventArgs args)
	{
		string hpStr = args.Value as string ?? "0";
		this.SessionCharacter.CurrentHP = uint.Parse(hpStr);

		DataUpdated?.Invoke(this, args);
	}

	private void UpdateMP(ChangeEventArgs args)
	{
		string mpStr = args.Value as string ?? "0";
		this.SessionCharacter.CurrentMP = uint.Parse(mpStr);

		DataUpdated?.Invoke(this, args);
	}

	private void UpdateData(object? sender, EventArgs args)
	{
		InvokeAsync(StateHasChanged);
	}
}
