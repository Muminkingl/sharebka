class PersistentStorage {
    constructor() {
        if (!('indexedDB' in window)) {
            PersistentStorage.logBrowserNotCapable();
            return;
        }
        const DBOpenRequest = window.indexedDB.open('pairdrop_store', 6);
        DBOpenRequest.onerror = e => {
            PersistentStorage.logBrowserNotCapable();
            console.log('Error initializing database: ');
            console.log(e)
        };
        DBOpenRequest.onsuccess = _ => {
            console.log('Database initialised.');
        };
        DBOpenRequest.onupgradeneeded = e => {
            const db = e.target.result;
            const txn = e.target.transaction;

            db.onerror = e => console.log('Error loading database: ' + e);

            console.log(`Upgrading IndexedDB database from version ${e.oldVersion} to version ${e.newVersion}`);

            if (e.oldVersion === 0) {
                // initiate v1
                db.createObjectStore('keyval');
                let roomSecretsObjectStore1 = db.createObjectStore('room_secrets', {autoIncrement: true});
                roomSecretsObjectStore1.createIndex('secret', 'secret', { unique: true });
            }
            if (e.oldVersion <= 1) {
                // migrate to v2
                db.createObjectStore('share_target_files');
            }
            if (e.oldVersion <= 2) {
                // migrate to v3
                db.deleteObjectStore('share_target_files');
                db.createObjectStore('share_target_files', {autoIncrement: true});
            }
            if (e.oldVersion <= 3) {
                // migrate to v4
                let roomSecretsObjectStore4 = txn.objectStore('room_secrets');
                roomSecretsObjectStore4.createIndex('display_name', 'display_name');
                roomSecretsObjectStore4.createIndex('auto_accept', 'auto_accept');
            }
            if (e.oldVersion <= 4) {
                // migrate to v5
                const keyval = txn.objectStore('keyval');
                const editedDisplayNameRequest = keyval.get('editedDisplayName');
                editedDisplayNameRequest.onsuccess = event => {
                    const editedDisplayNameOld = event.target.result;
                    if (!editedDisplayNameOld) return;
                    keyval.put(editedDisplayNameOld, 'edited_display_name');
                    keyval.delete('editedDisplayName');
                };
            }
            if (e.oldVersion <= 5) {
                const roomSecretsStore = txn.objectStore('room_secrets');
                if (roomSecretsStore.indexNames.contains('secret')) roomSecretsStore.deleteIndex('secret');
                roomSecretsStore.createIndex('secret', 'secret', { unique: false });
                const scope = PersistentStorage._scope();
                const cursorRequest = roomSecretsStore.openCursor();
                cursorRequest.onsuccess = event => {
                    const cursor = event.target.result;
                    if (!cursor) return;
                    const entry = cursor.value;
                    if (!entry.scope) cursor.update(Object.assign({}, entry, {scope: scope}));
                    cursor.continue();
                };
            }
        }
    }

    static _scope() {
        if (typeof location === 'undefined') return 'default';
        const signalingServer = typeof window !== 'undefined' && window.__PAIR_DROP_SIGNALING_SERVER__;
        if (signalingServer) {
            try {
                const protocol = location.protocol.startsWith('https') ? 'https://' : 'http://';
                const signalingUrl = new URL(protocol + signalingServer + 'server');
                return `${signalingUrl.origin}${signalingUrl.pathname.replace(/server$/, '')}`.replace(/\/+$/, '/');
            } catch (_) {
                // Fall back to the frontend origin when a deployment supplied
                // an invalid signaling host; the connection will report it.
            }
        }
        return `${location.origin}${location.pathname}`.replace(/\/+$/, '/');
    }

    static _key(key) {
        return `pairdrop:${this._scope()}:${key}`;
    }

    static logBrowserNotCapable() {
        console.log("This browser does not support IndexedDB. Paired devices will be gone after the browser is closed.");
    }

    static set(key, value) {
        return new Promise((resolve, reject) => {
            const DBOpenRequest = window.indexedDB.open('pairdrop_store');
            DBOpenRequest.onsuccess = e => {
                const db = e.target.result;
                const transaction = db.transaction('keyval', 'readwrite');
                const objectStore = transaction.objectStore('keyval');
                const objectStoreRequest = objectStore.put(value, PersistentStorage._key(key));
                objectStoreRequest.onsuccess = _ => {
                    console.log(`Request successful. Added key-pair: ${key} - ${value}`);
                    resolve(value);
                };
            }
            DBOpenRequest.onerror = e => {
                reject(e);
            }
        })
    }

    static get(key) {
        return new Promise((resolve, reject) => {
            const DBOpenRequest = window.indexedDB.open('pairdrop_store');
            DBOpenRequest.onsuccess = e => {
                const db = e.target.result;
                const transaction = db.transaction('keyval', 'readonly');
                const objectStore = transaction.objectStore('keyval');
                const objectStoreRequest = objectStore.get(PersistentStorage._key(key));
                objectStoreRequest.onsuccess = _ => {
                    if (objectStoreRequest.result !== undefined) {
                        console.log(`Request successful. Retrieved key-pair: ${key} - ${objectStoreRequest.result}`);
                        resolve(objectStoreRequest.result);
                        return;
                    }
                    const legacyRequest = objectStore.get(key);
                    legacyRequest.onsuccess = _ => resolve(legacyRequest.result);
                    legacyRequest.onerror = e => reject(e);
                }
            }
            DBOpenRequest.onerror = e => {
                reject(e);
            }
        });
    }

    static delete(key) {
        return new Promise((resolve, reject) => {
            const DBOpenRequest = window.indexedDB.open('pairdrop_store');
            DBOpenRequest.onsuccess = e => {
                const db = e.target.result;
                const transaction = db.transaction('keyval', 'readwrite');
                const objectStore = transaction.objectStore('keyval');
                const objectStoreRequest = objectStore.delete(PersistentStorage._key(key));
                objectStoreRequest.onsuccess = _ => {
                    objectStore.delete(key);
                    console.log(`Request successful. Deleted key: ${key}`);
                    resolve();
                };
            }
            DBOpenRequest.onerror = e => {
                reject(e);
            }
        })
    }

    static addRoomSecret(roomSecret, displayName, deviceName) {
        return new Promise((resolve, reject) => {
            const DBOpenRequest = window.indexedDB.open('pairdrop_store');
            DBOpenRequest.onsuccess = e => {
                const db = e.target.result;
                const transaction = db.transaction('room_secrets', 'readwrite');
                const objectStore = transaction.objectStore('room_secrets');
                const objectStoreRequest = objectStore.add({
                    'secret': roomSecret,
                    'scope': PersistentStorage._scope(),
                    'display_name': displayName,
                    'device_name': deviceName,
                    'auto_accept': false
                });
                objectStoreRequest.onsuccess = e => {
                    console.log(`Request successful. RoomSecret added: ${e.target.result}`);
                    resolve();
                }
            }
            DBOpenRequest.onerror = e => {
                reject(e);
            }
        })
    }

    static async getAllRoomSecrets() {
        try {
            const roomSecrets = await this.getAllRoomSecretEntries();
            let secrets = [];
            for (let i = 0; i < roomSecrets.length; i++) {
                secrets.push(roomSecrets[i].secret);
            }
            console.log(`Request successful. Retrieved ${secrets.length} room_secrets`);
            return(secrets);
        } catch (e) {
            this.logBrowserNotCapable();
            return [];
        }
    }

    static getAllRoomSecretEntries() {
        return new Promise((resolve, reject) => {
            const DBOpenRequest = window.indexedDB.open('pairdrop_store');
            DBOpenRequest.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction('room_secrets', 'readonly');
                const objectStore = transaction.objectStore('room_secrets');
                const objectStoreRequest = objectStore.getAll();
                objectStoreRequest.onsuccess = e => {
                    const scope = PersistentStorage._scope();
                    resolve(e.target.result.filter(entry => entry.scope === scope));
                }
            }
            DBOpenRequest.onerror = (e) => {
                reject(e);
            }
        });
    }

    static getRoomSecretEntry(roomSecret) {
        return new Promise((resolve, reject) => {
            const DBOpenRequest = window.indexedDB.open('pairdrop_store');
            DBOpenRequest.onsuccess = e => {
                const db = e.target.result;
                const transaction = db.transaction('room_secrets', 'readonly');
                const objectStore = transaction.objectStore('room_secrets');
                const cursorRequest = objectStore.openCursor();
                cursorRequest.onsuccess = e => {
                    const cursor = e.target.result;
                    if (!cursor) {
                        console.log(`Nothing to retrieve. Entry for room_secret not existing: ${roomSecret}`);
                        resolve();
                        return;
                    }
                    const entry = cursor.value;
                    if (entry.secret === roomSecret && entry.scope === PersistentStorage._scope()) {
                        resolve({"entry": entry, "key": cursor.primaryKey});
                        return;
                    }
                    cursor.continue();
                };
                cursorRequest.onerror = e => reject(e);
            }
            DBOpenRequest.onerror = (e) => {
                reject(e);
            }
        });
    }

    static deleteRoomSecret(roomSecret) {
        return new Promise((resolve, reject) => {
            const DBOpenRequest = window.indexedDB.open('pairdrop_store');
            DBOpenRequest.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction('room_secrets', 'readwrite');
                const objectStore = transaction.objectStore('room_secrets');
                const cursorRequest = objectStore.openCursor();
                cursorRequest.onsuccess = e => {
                    const cursor = e.target.result;
                    if (!cursor) {
                        console.log(`Nothing to delete. room_secret not existing: ${roomSecret}`);
                        resolve();
                        return;
                    }
                    const entry = cursor.value;
                    if (entry.secret === roomSecret && entry.scope === PersistentStorage._scope()) {
                        const objectStoreRequestDeletion = cursor.delete();
                        objectStoreRequestDeletion.onsuccess = _ => resolve(roomSecret);
                        objectStoreRequestDeletion.onerror = e => reject(e);
                        return;
                    }
                    cursor.continue();
                };
                cursorRequest.onerror = e => reject(e);
            }
            DBOpenRequest.onerror = e => {
                reject(e);
            }
        })
    }

    static clearRoomSecrets() {
        return new Promise((resolve, reject) => {
            const DBOpenRequest = window.indexedDB.open('pairdrop_store');
            DBOpenRequest.onsuccess = (e) => {
                const db = e.target.result;
                const transaction = db.transaction('room_secrets', 'readwrite');
                const objectStore = transaction.objectStore('room_secrets');
                const cursorRequest = objectStore.openCursor();
                cursorRequest.onsuccess = e => {
                    const cursor = e.target.result;
                    if (!cursor) {
                        console.log('Request successful. Scoped room_secrets cleared');
                        resolve();
                        return;
                    }
                    if (cursor.value.scope === PersistentStorage._scope()) cursor.delete();
                    cursor.continue();
                };
                cursorRequest.onerror = e => reject(e);
            }
            DBOpenRequest.onerror = e => {
                reject(e);
            }
        })
    }

    static updateRoomSecretNames(roomSecret, displayName, deviceName) {
        return this.updateRoomSecret(roomSecret, undefined, displayName, deviceName);
    }

    static updateRoomSecretAutoAccept(roomSecret, autoAccept) {
        return this.updateRoomSecret(roomSecret, undefined, undefined, undefined, autoAccept);
    }

    static updateRoomSecret(roomSecret, updatedRoomSecret = undefined, updatedDisplayName = undefined, updatedDeviceName = undefined, updatedAutoAccept = undefined) {
        return new Promise((resolve, reject) => {
            const DBOpenRequest = window.indexedDB.open('pairdrop_store');
            DBOpenRequest.onsuccess = e => {
                const db = e.target.result;
                this.getRoomSecretEntry(roomSecret)
                    .then(roomSecretEntry => {
                        if (!roomSecretEntry) {
                            resolve(false);
                            return;
                        }
                        const transaction = db.transaction('room_secrets', 'readwrite');
                        const objectStore = transaction.objectStore('room_secrets');
                        // Do not use `updatedRoomSecret ?? roomSecretEntry.entry.secret` to ensure compatibility with older browsers
                        const updatedRoomSecretEntry = {
                            'secret': updatedRoomSecret !== undefined ? updatedRoomSecret : roomSecretEntry.entry.secret,
                            'scope': roomSecretEntry.entry.scope || PersistentStorage._scope(),
                            'display_name': updatedDisplayName !== undefined ? updatedDisplayName : roomSecretEntry.entry.display_name,
                            'device_name': updatedDeviceName !== undefined ? updatedDeviceName : roomSecretEntry.entry.device_name,
                            'auto_accept': updatedAutoAccept !== undefined ? updatedAutoAccept : roomSecretEntry.entry.auto_accept
                        };

                        const objectStoreRequestUpdate = objectStore.put(updatedRoomSecretEntry, roomSecretEntry.key);

                        objectStoreRequestUpdate.onsuccess = e => {
                            console.log(`Request successful. Updated room_secret: ${roomSecretEntry.key}`);
                            resolve({
                                "entry": updatedRoomSecretEntry,
                                "key": roomSecretEntry.key
                            });
                        }

                        objectStoreRequestUpdate.onerror = (e) => {
                            reject(e);
                        }
                    })
                    .catch(e => reject(e));
            };

            DBOpenRequest.onerror = e => reject(e);
        })
    }
}
