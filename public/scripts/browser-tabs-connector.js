class BrowserTabsConnector {
    constructor() {
        if (!('BroadcastChannel' in window)) return;

        this.bc = new BroadcastChannel(`pairdrop:${BrowserTabsConnector._scope()}`);
        this.bc.addEventListener('message', e => this._onMessage(e));
        Events.on('broadcast-send', e => this._broadcastSend(e.detail));
    }

    _broadcastSend(message) {
        if (this.bc) this.bc.postMessage(message);
    }

    _onMessage(e) {
        console.log('Broadcast:', e.data)
        switch (e.data.type) {
            case 'self-display-name-changed':
                Events.fire('self-display-name-changed', e.data.detail);
                break;
        }
    }

    static peerIsSameBrowser(peerId) {
        let peerIdsBrowser = BrowserTabsConnector._readPeerIds();
        return peerIdsBrowser
            ? peerIdsBrowser.indexOf(peerId) !== -1
            : false;
    }

    static async addPeerIdToLocalStorage() {
        const peerId = sessionStorage.getItem('peer_id');
        if (!peerId) return false;

        let peerIdsBrowser = [];
        let peerIdsBrowserOld = BrowserTabsConnector._readPeerIds();

        if (peerIdsBrowserOld) peerIdsBrowser.push(...peerIdsBrowserOld);
        peerIdsBrowser.push(peerId);
        peerIdsBrowser = peerIdsBrowser.filter(onlyUnique);
        localStorage.setItem(BrowserTabsConnector._storageKey(), JSON.stringify(peerIdsBrowser));

        return peerIdsBrowser;
    }

    static async removePeerIdFromLocalStorage(peerId) {
        let peerIdsBrowser = BrowserTabsConnector._readPeerIds();
        const index = peerIdsBrowser.indexOf(peerId);
        if (index !== -1) peerIdsBrowser.splice(index, 1);
        localStorage.setItem(BrowserTabsConnector._storageKey(), JSON.stringify(peerIdsBrowser));
        return peerId;
    }


    static async removeOtherPeerIdsFromLocalStorage() {
        const peerId = sessionStorage.getItem('peer_id');
        if (!peerId) return false;

        let peerIdsBrowser = [peerId];
        localStorage.setItem(BrowserTabsConnector._storageKey(), JSON.stringify(peerIdsBrowser));
        return peerIdsBrowser;
    }

    static _scope() {
        return `${location.origin}${location.pathname}`.replace(/\/+$/, '/');
    }

    static _storageKey() {
        return `pairdrop_peer_ids:${BrowserTabsConnector._scope()}`;
    }

    static _readPeerIds() {
        try {
            const value = JSON.parse(localStorage.getItem(BrowserTabsConnector._storageKey()));
            return Array.isArray(value) ? value : [];
        } catch (_) {
            return [];
        }
    }
}
