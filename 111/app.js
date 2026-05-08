const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
    setup() {
        // --- State ---
        const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
        const currentView = ref('home'); // home, detail, profile
        const currentUser = ref(null); // null means not logged in
        const showAuthModal = ref(false);
        const authTab = ref('login'); // login, register

        // Forms
        const loginForm = ref({ username: '', password: '' });
        const registerForm = ref({ username: '', password: '', confirmPassword: '', avatar: '' });
        const newPostContent = ref('');
        const newCommentContent = ref('');

        // Data
        const users = ref([
            { id: 1, username: '罗健豪', password: '123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=罗健豪', registerTime: new Date('2025-03-15T00:00:00').getTime() },
            { id: 2, username: '张三', password: '123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ZhangSan', registerTime: new Date('2025-03-14T00:00:00').getTime() },
            { id: 3, username: '李四', password: '123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LiSi', registerTime: new Date('2025-03-13T00:00:00').getTime() },
            { id: 4, username: '王五', password: '123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WangWu', registerTime: new Date('2025-03-12T00:00:00').getTime() }
        ]);
        
        // Mock some initial posts
        const contents = [
            '由各种物质组成的巨型球状天体，叫做星球。星球有一定的形状，有自己的运行轨道。',
            '今天天气真不错，适合出去郊游！',
            '分享一首好听的歌，最近一直单曲循环。',
            '刚看完一部电影，剧情太震撼了，强烈推荐大家去看看！',
            '努力学习前端开发，Vue3的Composition API真好用。'
        ];
        
        const generateMockPosts = () => {
            return Array.from({ length: 25 }, (_, i) => {
                const author = users.value[Math.floor(Math.random() * users.value.length)];
                const commentAuthor = users.value[Math.floor(Math.random() * users.value.length)];
                const randomContent = contents[Math.floor(Math.random() * contents.length)];
                return {
                    id: i + 1,
                    author: author,
                    content: `${randomContent} 这是第 ${25 - i} 条动态。` + (i % 2 === 0 ? ' 更多内容更多内容更多内容。' : ''),
                    createTime: new Date(Date.now() - i * 3600000).getTime(),
                    comments: [
                        { id: i * 10 + 1, author: commentAuthor, content: '评论1完整内容', createTime: new Date(Date.now() - i * 3600000 + 10000).getTime() }
                    ]
                };
            });
        };
        
        const posts = ref([]);

        // Initialization logic
        onMounted(() => {
            // Load users
            const savedUsers = localStorage.getItem('weibo_users');
            if (savedUsers) {
                users.value = JSON.parse(savedUsers);
            } else {
                localStorage.setItem('weibo_users', JSON.stringify(users.value));
            }

            // Load posts
            const savedPosts = localStorage.getItem('weibo_posts');
            if (savedPosts) {
                posts.value = JSON.parse(savedPosts);
            } else {
                const initialPosts = generateMockPosts();
                posts.value = initialPosts;
                localStorage.setItem('weibo_posts', JSON.stringify(initialPosts));
            }

            // Load current user session
            const savedCurrentUser = localStorage.getItem('weibo_current_user');
            if (savedCurrentUser) {
                currentUser.value = JSON.parse(savedCurrentUser);
            }
        });

        // Save data to localStorage helper
        const saveData = () => {
            localStorage.setItem('weibo_posts', JSON.stringify(posts.value));
            localStorage.setItem('weibo_users', JSON.stringify(users.value));
        };

        // Pagination for posts
        const postsPage = ref(1);
        const postsPerPage = 10;
        
        // View specific state
        const currentPost = ref(null);
        const viewingUser = ref(null);
        
        // Pagination for comments
        const commentsPage = ref(1);
        const commentsPerPage = 10;

        // --- Computed ---
        const displayPosts = computed(() => {
            const sorted = [...posts.value].sort((a, b) => b.createTime - a.createTime);
            return sorted.slice(0, postsPage.value * postsPerPage);
        });

        const hasMorePosts = computed(() => {
            return displayPosts.value.length < posts.value.length;
        });

        const displayComments = computed(() => {
            if (!currentPost.value) return [];
            const sorted = [...currentPost.value.comments].sort((a, b) => b.createTime - a.createTime);
            return sorted.slice(0, commentsPage.value * commentsPerPage);
        });

        const hasMoreComments = computed(() => {
            if (!currentPost.value) return false;
            return displayComments.value.length < currentPost.value.comments.length;
        });

        // --- Methods ---
        
        // Format time
        const formatTime = (timestamp, isDateOnly = false) => {
            const d = new Date(timestamp);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const date = d.getDate();
            if (isDateOnly) return `${year}.${month}.${date}`;
            
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            const seconds = d.getSeconds().toString().padStart(2, '0');
            return `${year}.${month}.${date} ${hours}:${minutes}:${seconds}`;
        };

        // Auth
        const handleLogin = () => {
            const { username, password } = loginForm.value;
            if (!username || !password) {
                alert('请输入用户名和密码');
                return;
            }
            const user = users.value.find(u => u.username === username && u.password === password);
            if (user) {
                currentUser.value = user;
                localStorage.setItem('weibo_current_user', JSON.stringify(user));
                showAuthModal.value = false;
                loginForm.value = { username: '', password: '' };
                alert('登录成功');
            } else {
                alert('用户名或密码错误');
            }
        };

        const handleRegister = () => {
            const { username, password, confirmPassword, avatar } = registerForm.value;
            if (!username || !password) {
                alert('请输入完整信息');
                return;
            }
            if (password !== confirmPassword) {
                alert('两次密码输入不一致');
                return;
            }
            if (users.value.some(u => u.username === username)) {
                alert('用户名已存在');
                return;
            }
            
            const newUser = {
                id: Date.now(),
                username,
                password,
                avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                registerTime: Date.now()
            };
            users.value.push(newUser);
            currentUser.value = newUser;
            saveData();
            localStorage.setItem('weibo_current_user', JSON.stringify(newUser));
            showAuthModal.value = false;
            registerForm.value = { username: '', password: '', confirmPassword: '', avatar: '' };
            alert('注册成功并已登录');
        };

        const handleAvatarUpload = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    registerForm.value.avatar = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        const logout = () => {
            currentUser.value = null;
            localStorage.removeItem('weibo_current_user');
            if (currentView.value === 'profile' && viewingUser.value?.id === currentUser.value?.id) {
                currentView.value = 'home';
            }
        };

        // Post actions
        const goToCreatePost = () => {
            if (!currentUser.value) {
                showAuthModal.value = true;
                authTab.value = 'login';
                return;
            }
            currentView.value = 'create';
        };

        const createPost = () => {
            if (!currentUser.value) {
                showAuthModal.value = true;
                return;
            }
            if (!newPostContent.value.trim()) {
                alert('请输入内容');
                return;
            }
            
            const post = {
                id: Date.now(),
                author: currentUser.value,
                content: newPostContent.value,
                createTime: Date.now(),
                comments: []
            };
            
            posts.value.unshift(post); // Add to beginning
            saveData();
            newPostContent.value = '';
            currentView.value = 'home';
        };

        const loadMorePosts = () => {
            postsPage.value++;
        };

        // Detail & Comments
        const viewPostDetail = (post) => {
            currentPost.value = post;
            commentsPage.value = 1;
            currentView.value = 'detail';
        };

        const createComment = () => {
            if (!currentUser.value) {
                showAuthModal.value = true;
                return;
            }
            if (!newCommentContent.value.trim()) {
                alert('请输入评论内容');
                return;
            }
            
            const comment = {
                id: Date.now(),
                author: currentUser.value,
                content: newCommentContent.value,
                createTime: Date.now()
            };
            
            currentPost.value.comments.unshift(comment);
            saveData();
            newCommentContent.value = '';
        };

        const loadMoreComments = () => {
            commentsPage.value++;
        };

        // Profile
        const viewProfile = (user) => {
            viewingUser.value = user;
            currentView.value = 'profile';
        };

        const goBack = () => {
            currentView.value = 'home';
        };

        return {
            defaultAvatar,
            currentView,
            currentUser,
            showAuthModal,
            authTab,
            loginForm,
            registerForm,
            newPostContent,
            newCommentContent,
            displayPosts,
            hasMorePosts,
            currentPost,
            displayComments,
            hasMoreComments,
            viewingUser,
            formatTime,
            handleLogin,
            handleRegister,
            handleAvatarUpload,
            logout,
            createPost,
            goToCreatePost,
            loadMorePosts,
            viewPostDetail,
            createComment,
            loadMoreComments,
            viewProfile,
            goBack
        };
    }
});

app.mount('#app');