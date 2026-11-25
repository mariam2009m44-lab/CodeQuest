# Learning studio

119 authored draft lessons across35 units: Python48, JavaScript26, C++23, Java22. All planned lessons have scripts; editorial and integration work remain. All119 detailed original comic scenes have passed continuity and loaded-view inspection.

Execution uses the existing authenticated platform language runner. The separate loopback development compiler is not included. No interpreter fallback is used for learner execution. All113 scripted paths passed local real-compiler browser regression. This does not establish authenticated production service health.

The lesson sequence includes prediction, worked execution, editable practice, explanation choices and transfer. The structural concept checker supports restricted syntax, including harmless renaming, formatting, compound assignment, numeric commutation and reversed ordered comparisons. It still does not recognize every valid algorithm. No account rewards or legacy achievements are written. Signed-in studio evidence uses an independent versioned server-verified namespace. The UI confirms saved status only after server acknowledgement; local preview and failed/unavailable verification remain session-only. Optional display name and unsaved code stay in memory, never account storage. Saved completion is shown on reload; exercises restart for review rather than fabricating a recovered code draft.

Portable tests: node --test tests/learning-studio/*.test.mjs. Current result:921 passing, including122 canonical route/sequence/fallback checks and60 additional equivalent-comparison and rejection checks. Concept explanations and lesson-specific hints have been copyedited. Four account-guard fixtures check signed-out return, logout, identity-switch isolation and content-load error separation; they do not prove production authentication. Local account proof fixtures, backend verification, Firestore rules/Admin emulator and dual-entry navigation are tested. Actual authenticated production execution and deployed account proof remain unverified. This is not a finished course or evidence of student learning.


Release mode: learning-studio/features.json sets accountEvidence to false until the server functions and rules are deployed and verified. While false the page makes no callable requests and says progress is for this session only. Flip it to true only in the same release as the verified backend.
