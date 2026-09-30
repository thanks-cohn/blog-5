import { describe, expect, it } from "vitest";
import {
  chooseIntermissionTrack,
  journeyTargets,
  nextJourneyStep,
  normalizeFocusJourneyConfig,
  previousJourneyStep,
  restartJourneyStep,
  type JourneyTarget
} from "./focusJourney";

const targets: JourneyTarget[] = [
  { stationId: "a", stationIndex: 0, assetName: "a-1.glb", track: "a1.mp3" },
  { stationId: "a", stationIndex: 0, assetName: "a-2.glb", track: "a2.mp3" },
  { stationId: "b", stationIndex: 1, assetName: "b-1.glb", track: "b1.mp3" }
];

describe("focusJourney", () => {
  it("filters to the current station or keeps the whole world", () => {
    expect(
      journeyTargets(targets, normalizeFocusJourneyConfig({ scope: "station" }), "a")
    ).toHaveLength(2);
    expect(
      journeyTargets(targets, normalizeFocusJourneyConfig({ scope: "all" }), "a")
    ).toHaveLength(3);
  });

  it("randomizes intermissions while avoiding an immediate repeat by default", () => {
    const config = normalizeFocusJourneyConfig({
      intermission: {
        enabled: true,
        tracks: ["one.mp3", "two.mp3", "three.mp3"],
        strategy: "random",
        sequence: [],
        avoidImmediateRepeat: true,
        between: "stations",
        playToEnd: true
      }
    });
    const picked = chooseIntermissionTrack(
      config,
      { phase: "focus", index: 0, direction: "forward", lastIntermissionTrack: "one.mp3" },
      0
    );
    expect(picked).toBe("two.mp3");
  });

  it("supports authored intermission sequences without changing the journey model", () => {
    const config = normalizeFocusJourneyConfig({
      intermission: {
        enabled: true,
        tracks: ["fallback.mp3"],
        strategy: "sequence",
        sequence: ["intro.mp3", "bridge.mp3", "outro.mp3"],
        avoidImmediateRepeat: false,
        between: "items",
        playToEnd: true
      }
    });
    const selected = chooseIntermissionTrack(
      config,
      { phase: "focus", index: 0, direction: "forward", intermissionCursor: 1 },
      0.9
    );
    expect(selected).toBe("bridge.mp3");
  });

  it("inserts a play-to-end intermission before crossing to another station", () => {
    const config = normalizeFocusJourneyConfig({
      scope: "all",
      intermission: {
        enabled: true,
        tracks: ["intermission.mp3"],
        strategy: "random",
        sequence: [],
        avoidImmediateRepeat: true,
        between: "stations",
        playToEnd: true
      }
    });
    const step = nextJourneyStep(
      targets,
      { phase: "focus", index: 1, direction: "forward" },
      config,
      0
    );
    expect(step.type).toBe("intermission");
    if (step.type === "intermission") {
      expect(step.track).toBe("intermission.mp3");
      expect(step.playToEnd).toBe(true);
      expect(step.then.target.assetName).toBe("b-1.glb");
    }
  });

  it("wraps forever when configured to wrap", () => {
    const step = nextJourneyStep(
      targets,
      { phase: "focus", index: 2, direction: "forward" },
      normalizeFocusJourneyConfig({ scope: "all", boundary: "wrap" })
    );
    expect(step.type).toBe("focus");
    if (step.type === "focus") expect(step.target.assetName).toBe("a-1.glb");
  });

  it("supports semantic previous without faking an arrow key", () => {
    const step = previousJourneyStep(
      targets,
      { phase: "focus", index: 1, direction: "forward" },
      normalizeFocusJourneyConfig({ scope: "all", boundary: "wrap" })
    );
    expect(step.type).toBe("focus");
    if (step.type === "focus") expect(step.target.assetName).toBe("a-1.glb");
  });

  it("can explicitly restart at the first target", () => {
    const step = restartJourneyStep(
      targets,
      { phase: "focus", index: 2, direction: "forward" },
      normalizeFocusJourneyConfig({ scope: "all", boundary: "wrap" })
    );
    expect(step.type).toBe("focus");
    if (step.type === "focus") {
      expect(step.index).toBe(0);
      expect(step.target.assetName).toBe("a-1.glb");
    }
  });
});
