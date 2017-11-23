var bc = window.bc = (window.bc || {});

/**
 *  @typedef {(object)} SessionState
 */

(function() {
    /**
     * An enumeration for session state.
     */
    bc.SessionState = {
        Idle: 0,
        InitialLoading: 1,
        PreChat: 2,
        PreChatSending: 3,
        ChatActive: 4,
        ChatInactive: 5,
        ChatEnding: 6,
        PostChat: 7,
        PostChatSending: 8,
        UnavailableChat: 9,
        UnavailableChatSending: 10,
        Finished: 11,
        Error: 12
    };

    if(Object.freeze) {
        Object.freeze(bc.SessionState);
    }
}());
