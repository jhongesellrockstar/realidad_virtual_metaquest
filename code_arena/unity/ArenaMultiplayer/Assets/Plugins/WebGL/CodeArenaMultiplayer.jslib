mergeInto(LibraryManager.library, {
  CodeArenaSendMovement: function (x, y, sequence) {
    window.parent.postMessage({
      source: "code-arena-unity",
      type: "player_move",
      payload: { x: x, y: y, sequence: sequence }
    }, window.location.origin);
  }
});
