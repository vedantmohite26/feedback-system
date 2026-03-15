document.addEventListener('DOMContentLoaded', () => {
    // 1. Listen for Auth State to load Dashboard data securely
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('user-display-name').innerText = user.displayName || user.email;
        
        // 2. Fetch User Profile/Role from Firestore
        const db = firebase.firestore();
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                
                if (data.isActive === false) {
                    await firebase.auth().signOut();
                    window.location.href = 'index.html';
                    return;
                }
                
                const role = data.role;
                const badge = document.getElementById('user-role-badge');
                badge.innerText = role;
                badge.classList.remove('hidden');
                
                if (role === 'ADMIN' || role === 'AUTHORITY') {
                    badge.classList.add('pending'); // Visual style from CSS
                }
                
                // Store role locally just for UI logic toggles
                window.currentUserRole = role; 
                
                // 3. Load Application Data
                loadIssues();
                loadPolls();
            }
        } catch(e) {
            console.error("Error fetching user role", e);
        }
    });
});

function toggleIssueForm() {
    const form = document.getElementById('new-issue-form');
    form.classList.toggle('hidden');
}

async function submitNewIssue(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-issue');
    const errBox = document.getElementById('issue-err');
    errBox.innerText = '';
    btn.disabled = true;

    try {
        const cat = document.getElementById('issue-category').value;
        const desc = document.getElementById('issue-description').value;
        const fileInput = document.getElementById('issue-file');
        const currentUser = firebase.auth().currentUser;
        
        // 1. Create Issue Document
        const issueRef = await firebase.firestore().collection('issues').add({
            category: cat,
            description: desc,
            userId: currentUser.uid,
            status: 'PENDING',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        const issueId = issueRef.id;

        // 2. Create Initial Audit Log
        await firebase.firestore().collection('auditLogs').add({
            action: 'ISSUE_CREATED',
            performedBy: currentUser.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            metadata: { issueId, category: cat }
        });
        
        // 3. Handle File Upload if present
        if (fileInput.files.length > 0) {
            btn.innerText = 'Encrypting & Uploading...';
            const file = fileInput.files[0];
            
            const fd = new FormData();
            fd.append('file', file);
            fd.append('upload_preset', 'ml_default');
            fd.append('folder', `secure-feedback/${issueId}`);
            
            const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dba85njbc/auto/upload', {
                method: 'POST',
                body: fd
            });

            if(!uploadRes.ok) {
                throw new Error("Document upload failed.");
            }
            
            const cloudinaryData = await uploadRes.json();

            // 4. Save Cloudinary reference to Firestore
            await firebase.firestore().collection("documents").add({
                issueId: issueId,
                userId: currentUser.uid,
                fileName: file.name,
                storagePublicId: cloudinaryData.public_id,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                secureUrl: cloudinaryData.secure_url
            });
        }

        toggleIssueForm();
        e.target.reset();
        await loadIssues(); // Refresh list

    } catch (err) {
        errBox.innerText = err.message || 'Error submitting issue';
    } finally {
        btn.innerText = 'Submit Issue';
        btn.disabled = false;
    }
}

async function loadIssues() {
    const container = document.getElementById('issues-list');
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;
    const isAuth = window.currentUserRole === 'ADMIN' || window.currentUserRole === 'AUTHORITY';

    try {
        // Build Query securely: Normal Users only see their own issues
        let query = db.collection('issues').orderBy('createdAt', 'desc');
        if (!isAuth) {
            query = query.where('userId', '==', user.uid);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No issues tracked yet.</p>';
            return;
        }

        let html = '';
        for (const doc of snapshot.docs) {
            const issue = doc.data();
            const id = doc.id;
            
            // Check if there are attached documents
            const docsSnap = await db.collection("documents").where("issueId", "==", id).get();
            const hasAttachment = !docsSnap.empty;
            let attachHtml = '';
            
            if (hasAttachment) {
                 const docId = docsSnap.docs[0].id;
                 attachHtml = `<span style="color: var(--primary); cursor: pointer;" onclick="downloadSecureDocument('${docId}')">📎 Download Attachment</span>`;
            }

            html += `
                <div class="issue-item">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>${escapeHtml(issue.category)}</strong>
                        <span class="badge ${issue.status.toLowerCase()}">${issue.status}</span>
                    </div>
                    <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">${escapeHtml(issue.description)}</p>
                    
                    <div style="font-size: 0.75rem; color: var(--text-muted); display:flex; justify-content: space-between;">
                        <span>Created: ${issue.createdAt ? new Date(issue.createdAt.toDate()).toLocaleDateString() : 'Just now'}</span>
                        ${attachHtml}
                    </div>

                    ${isAuth ? `
                        <div style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 0.5rem;">
                            <input type="text" placeholder="Remarks..." style="padding: 0.25rem; font-size: 0.75rem; width: 60%;" id="rem-${id}" value="${issue.remarks || ''}">
                            <select id="stat-${id}" style="padding: 0.25rem; font-size: 0.75rem; width: auto;">
                                <option value="PENDING" ${issue.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                                <option value="IN_PROGRESS" ${issue.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                                <option value="RESOLVED" ${issue.status === 'RESOLVED' ? 'selected' : ''}>Resolved</option>
                                <option value="REJECTED" ${issue.status === 'REJECTED' ? 'selected' : ''}>Rejected</option>
                            </select>
                            <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem;" onclick="updateIssueStatus('${id}')">Update</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = `<p style="color: var(--danger);">Failed to load issues.</p>`;
        console.error(err);
    }
}

async function updateIssueStatus(id) {
    const status = document.getElementById(`stat-${id}`).value;
    const remarks = document.getElementById(`rem-${id}`).value;
    
    try {
        const updateIssueStatusFn = firebase.functions().httpsCallable('updateIssueStatus');
        await updateIssueStatusFn({ issueId: id, status, remarks });
        loadIssues();
    } catch(err) {
        alert(err.message);
    }
}

async function loadPolls() {
    const container = document.getElementById('polls-list');
    const db = firebase.firestore();
    
    try {
        const snapshot = await db.collection('polls').where('isActive', '==', true).get();
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 0.875rem;">No active polls.</p>';
            return;
        }

        let html = '';
        for (const doc of snapshot.docs) {
            const poll = doc.data();
            const id = doc.id;
            
            // Fetch options subcollection
            const optionsSnap = await doc.ref.collection("options").get();
            let optionsHtml = '';
            optionsSnap.forEach(optDoc => {
                optionsHtml += `
                    <div style="margin-bottom: 0.5rem;">
                        <label style="font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                            <input type="radio" name="option_${id}" value="${optDoc.id}" required>
                            ${escapeHtml(optDoc.data().text)}
                        </label>
                    </div>
                `;
            });

            html += `
                <div style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                    <h4 style="margin-bottom: 0.5rem;">${escapeHtml(poll.title)}</h4>
                    <p style="font-size: 0.875rem; margin-bottom: 1rem;">${escapeHtml(poll.description)}</p>
                    <form id="poll-${id}" onsubmit="castVote(event, '${id}')">
                        ${optionsHtml}
                        <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem; width: 100%; font-size: 0.75rem;">Vote</button>
                    </form>
                </div>
            `;
        }
        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = `<p style="color: var(--danger); font-size: 0.875rem;">Failed to load polls.</p>`;
        console.error(err);
    }
}

async function castVote(e, pollId) {
    e.preventDefault();
    const form = e.target;
    const selectedInput = form.querySelector(`input[name="option_${pollId}"]:checked`);
    if (!selectedInput) return;
    
    const optionId = selectedInput.value;
    const btn = form.querySelector('button');
    btn.disabled = true;

    try {
        const currentUser = firebase.auth().currentUser;
        await firebase.firestore().collection("pollVotes").add({
            pollId: pollId,
            optionId: optionId,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        btn.innerText = 'Voted ✓';
        btn.classList.replace('btn-primary', 'btn-secondary');
    } catch (err) {
        alert("Failed to submit vote. Please try again.");
        btn.disabled = false;
    }
}

async function downloadSecureDocument(docId) {
    try {
        const getDownloadUrlFn = firebase.functions().httpsCallable('getDocumentDownloadUrl');
        const res = await getDownloadUrlFn({ docId });
        
        // This opens the signed URL downloading the AES-encrypted binary payload
        window.open(res.data.url, '_blank');
        
    } catch(err) {
        alert("Download Failed: " + err.message);
    }
}

function escapeHtml(unsafe) {
    return (unsafe || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
