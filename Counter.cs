namespace BlackTower;

public static class Counter
{
    public static event EventHandler CountUpdated;

    public static int CurrentCount
    {
        get => _currentCount;
        set
        {
            _currentCount = value;
            CountUpdated?.Invoke(null, EventArgs.Empty);
        }
    }

    private static int _currentCount = 0;
}
