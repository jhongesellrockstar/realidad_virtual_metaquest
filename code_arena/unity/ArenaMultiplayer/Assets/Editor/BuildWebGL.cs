using System;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;

public static class BuildWebGL
{
    public static void Build()
    {
        var scenes = EditorBuildSettings.scenes
            .Where(scene => scene.enabled)
            .Select(scene => scene.path)
            .ToArray();

        if (scenes.Length == 0)
        {
            throw new InvalidOperationException("No hay escenas habilitadas para el build WebGL.");
        }

        var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
        {
            scenes = scenes,
            locationPathName = "Builds/Web",
            target = BuildTarget.WebGL,
            options = BuildOptions.None,
        });

        if (report.summary.result != BuildResult.Succeeded)
        {
            throw new InvalidOperationException($"El build WebGL falló: {report.summary.result}");
        }
    }
}
