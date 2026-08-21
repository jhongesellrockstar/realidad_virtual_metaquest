using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;

public sealed class MultiplayerBridge : MonoBehaviour
{
    [System.Serializable]
    private sealed class RemoteState
    {
        public string uid;
        public float x;
        public float y;
        public int sequence;
    }

    private readonly Dictionary<string, Transform> remotePlayers = new();
    private Transform localPlayer;
    private string localUid;
    private int sequence;
    private float nextSendAt;

#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void CodeArenaSendMovement(float x, float y, int sequence);
#endif

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void CreateBridge()
    {
        if (FindFirstObjectByType<MultiplayerBridge>() != null) return;
        var bridge = new GameObject("MultiplayerBridge");
        DontDestroyOnLoad(bridge);
        bridge.AddComponent<MultiplayerBridge>();
    }

    private void Update()
    {
        if (localPlayer == null)
        {
            var localObject = GameObject.Find("PlayerLocal");
            if (localObject != null) localPlayer = localObject.transform;
        }

        if (localPlayer == null || Time.unscaledTime < nextSendAt) return;
        nextSendAt = Time.unscaledTime + 0.1f;
        sequence += 1;

#if UNITY_WEBGL && !UNITY_EDITOR
        CodeArenaSendMovement(localPlayer.position.x, localPlayer.position.y, sequence);
#endif
    }

    public void SetLocalUid(string uid)
    {
        localUid = uid;
        if (remotePlayers.TryGetValue(uid, out var remote))
        {
            Destroy(remote.gameObject);
            remotePlayers.Remove(uid);
        }
    }

    public void ReceiveRemoteState(string json)
    {
        var state = JsonUtility.FromJson<RemoteState>(json);
        if (string.IsNullOrWhiteSpace(state.uid) || state.uid == localUid) return;

        if (!remotePlayers.TryGetValue(state.uid, out var remote))
        {
            remote = CreateRemotePlayer(state.uid).transform;
            remotePlayers.Add(state.uid, remote);
        }

        remote.position = new Vector3(state.x, state.y, 0f);
    }

    public void RemoveRemotePlayer(string uid)
    {
        if (!remotePlayers.TryGetValue(uid, out var remote)) return;
        Destroy(remote.gameObject);
        remotePlayers.Remove(uid);
    }

    private static GameObject CreateRemotePlayer(string uid)
    {
        var remote = new GameObject($"PlayerRemote-{uid}");
        var renderer = remote.AddComponent<SpriteRenderer>();
        var texture = new Texture2D(1, 1);
        texture.SetPixel(0, 0, new Color(0.13f, 0.83f, 0.93f));
        texture.Apply();
        renderer.sprite = Sprite.Create(texture, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
        remote.transform.localScale = Vector3.one * 0.8f;
        return remote;
    }
}
