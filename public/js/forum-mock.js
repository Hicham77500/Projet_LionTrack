/**
 * Mock Data pour le Forum - À utiliser lors du développement
 * Remplace les appels API par des données fictives pour tester l'UI sans backend
 */

// Remplace le fetch global pour intercepter les requêtes API du forum
const originalFetch = window.fetch;

// Données mock
const mockData = {
  categories: [
    { id: '1', name: 'Motivation & Entraide', count: 12, icon: 'heart' },
    { id: '2', name: 'Défis & Conseils', count: 8, icon: 'trophy' },
    { id: '3', name: 'Partage de Résultats', count: 15, icon: 'chart-line' },
    { id: '4', name: 'Bugs & Support', count: 3, icon: 'bug' },
  ],

  subjects: [
    {
      id: '1',
      title: 'Comment rester motivé pendant un long défi ?',
      excerpt: 'Je lutte pour garder ma motivation après 3 semaines. Des conseils ?',
      message:
        'Bonjour à tous ! Je commence ma 4e semaine du défi 100 jours et j\'ai remarqué que ma motivation baisse progressivement. J\'aimerais connaître vos techniques pour rester motivé sur la durée. Merci !',
      categoryId: '1',
      author: {
        id: 'user1',
        username: 'AlexRunner',
        profileImage: 'https://i.pravatar.cc/150?img=1',
        role: 'user',
      },
      views: 156,
      replies: 12,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      pinned: true,
      locked: false,
      tags: ['motivation', 'défi', 'conseils'],
    },
    {
      id: '2',
      title: 'Résultat du défi "30 jours de sport" 🎉',
      excerpt: 'Hier j\'ai terminé mon défi de 30 jours. Avant/après et mes conseils...',
      message:
        'Après 30 jours de sport quotidien, je suis ravi de partager mes résultats ! J\'ai perdu 3kg, gagné en force et endurance. Les clés : régularité, progressivité et bon sommeil. À vos défis !',
      categoryId: '3',
      author: {
        id: 'user2',
        username: 'MarieAthlète',
        profileImage: 'https://i.pravatar.cc/150?img=2',
        role: 'user',
      },
      views: 234,
      replies: 18,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      pinned: false,
      locked: false,
      tags: ['sport', 'résultats', 'succès'],
    },
    {
      id: '3',
      title: 'Le défi peut-il être trop difficile ?',
      excerpt: 'Je suis débutant et je trouve mon défi très difficile...',
      message:
        'Nouveau utilisateur ici ! J\'ai créé un défi qui me semble trop difficile maintenant. Puis-je le modifier ou dois-je en créer un nouveau ? Comment gérez-vous les défis trop ambitieux ?',
      categoryId: '2',
      author: {
        id: 'user3',
        username: 'NouveauDébutant',
        profileImage: 'https://i.pravatar.cc/150?img=3',
        role: 'user',
      },
      views: 45,
      replies: 5,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      pinned: false,
      locked: false,
      tags: ['débutant', 'difficulté', 'aide'],
    },
    {
      id: '4',
      title: 'Bug : Les statistiques ne se sauvegardent pas',
      excerpt: 'Je complète mes défis mais mes stats restent à 0...',
      message:
        'Depuis hier, quand je marque mes défis comme complétés, les statistiques ne se mettent pas à jour. Quelqu\'un d\'autre a ce problème ? Version web (Chrome).',
      categoryId: '4',
      author: {
        id: 'user4',
        username: 'JeanTech',
        profileImage: 'https://i.pravatar.cc/150?img=4',
        role: 'user',
      },
      views: 23,
      replies: 2,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      pinned: false,
      locked: false,
      tags: ['bug', 'statistics', 'support'],
    },
    {
      id: '5',
      title: 'Idée : Badge spécial pour les défis de groupe',
      excerpt: 'Et si on créait des défis à faire en groupe ? Avec badges spéciaux...',
      message:
        'J\'aimerais proposer une fonctionnalité : les défis de groupe ! Plusieurs utilisateurs pourraient rejoindre le même défi et on pourrait avoir des badges de "champion d\'équipe". Qu\'en pensez-vous ?',
      categoryId: '2',
      author: {
        id: 'user5',
        username: 'CreativeMax',
        profileImage: 'https://i.pravatar.cc/150?img=5',
        role: 'moderator',
      },
      views: 89,
      replies: 7,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      pinned: false,
      locked: false,
      tags: ['feature-request', 'community', 'badges'],
    },
    {
      id: '6',
      title: '[ANNONCE] Nouvelle version 2.0 en préparation !',
      excerpt: 'L\'équipe travaille sur une grosse mise à jour...',
      message:
        'Annonce officielle : La version 2.0 de LionTrack sera lancée en mars 2026 ! 🦁\n\nNouvelles fonctionnalités : système de rebonds, défis collaboratifs, API publique, et bien plus !\n\nRestez informés !',
      categoryId: '1',
      author: {
        id: 'admin1',
        username: 'AdminLion',
        profileImage: 'https://i.pravatar.cc/150?img=99',
        role: 'admin',
      },
      views: 412,
      replies: 24,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivityAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      pinned: true,
      locked: false,
      tags: ['annonce', 'v2.0', 'release'],
    },
  ],

  currentUser: {
    id: 'user_current',
    username: 'TonProfil',
    email: 'user@example.com',
    profileImage: 'https://i.pravatar.cc/150?img=50',
    role: 'user',
  },

  // Réponses aux sujets
  replies: {
    '1': [ // Réponses au sujet "Comment rester motivé"
      {
        id: 'r1',
        subjectId: '1',
        content: 'Excellent conseil ! Personnellement, je me fixe des mini-objectifs chaque semaine. Ça permet de célébrer les petites victoires et garder la motivation.',
        author: {
          id: 'user3',
          username: 'CreativeMax',
          profileImage: 'https://i.pravatar.cc/150?img=3',
          role: 'moderator',
        },
        likes: 8,
        helpfulCount: 3,
        likedByCurrentUser: false,
        markedAsHelpful: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'r2',
        subjectId: '1',
        content: 'Pense à varier tes activités ! Quand je stagnais, j\'ai changé mon programme d\'entraînement et ça a tout changé. La routine tue la motivation.',
        author: {
          id: 'user2',
          username: 'MarieAthlète',
          profileImage: 'https://i.pravatar.cc/150?img=2',
          role: 'user',
        },
        likes: 12,
        helpfulCount: 7,
        likedByCurrentUser: false,
        markedAsHelpful: false,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 'r3',
        subjectId: '1',
        content: 'N\'oublie pas le repos ! J\'ai appris à mes dépens que la récupération est aussi importante que l\'effort. Ton corps et ton mental te remercieront.',
        author: {
          id: 'user1',
          username: 'AlexRunner',
          profileImage: 'https://i.pravatar.cc/150?img=1',
          role: 'user',
        },
        likes: 5,
        helpfulCount: 2,
        likedByCurrentUser: false,
        markedAsHelpful: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
    '2': [ // Réponses au sujet "Résultat du défi"
      {
        id: 'r4',
        subjectId: '2',
        content: 'Bravo pour ces résultats ! 🎉 Très inspirant. Je commence mon défi demain grâce à toi !',
        author: {
          id: 'user1',
          username: 'AlexRunner',
          profileImage: 'https://i.pravatar.cc/150?img=1',
          role: 'user',
        },
        likes: 3,
        helpfulCount: 0,
        likedByCurrentUser: false,
        markedAsHelpful: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'r5',
        subjectId: '2',
        content: 'Super résultats ! Tu pourrais partager ton programme d\'entraînement ? Je suis curieux de voir ce que tu as fait exactement.',
        author: {
          id: 'user3',
          username: 'CreativeMax',
          profileImage: 'https://i.pravatar.cc/150?img=3',
          role: 'moderator',
        },
        likes: 6,
        helpfulCount: 4,
        likedByCurrentUser: false,
        markedAsHelpful: false,
        createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      },
    ],
    '3': [], // Pas de réponse
    '4': [], // Pas de réponse  
    '5': [], // Pas de réponse
    '6': [], // Pas de réponse
  },
};

// Intercepte les requêtes API
window.fetch = function (...args) {
  const url = args[0];
  const options = args[1] || {};

  // Forum - Récupérer les sujets
  if (url.includes('/api/forum/subjects') && options.method !== 'POST' && options.method !== 'PUT') {
    return Promise.resolve(
      new Response(JSON.stringify(mockData.subjects), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Forum - Créer un sujet
  if (url.includes('/api/forum/subjects') && options.method === 'POST') {
    const body = JSON.parse(options.body);
    const newSubject = {
      id: Date.now().toString(),
      ...body,
      author: mockData.currentUser,
      views: 0,
      replies: 0,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      pinned: false,
      locked: false,
    };
    mockData.subjects.unshift(newSubject);
    return Promise.resolve(
      new Response(JSON.stringify(newSubject), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Forum - Actions modérateur
  if (
    url.includes('/api/forum/subjects') &&
    (url.includes('/pin') || url.includes('/unpin') || url.includes('/lock') || url.includes('/unlock') ||
      url.includes('/delete'))
  ) {
    const subjectId = url.match(/subjects\/([^\/]+)/)[1];
    const action = url.split('/').pop();

    const subject = mockData.subjects.find((s) => s.id === subjectId);
    if (subject) {
      if (action === 'pin') subject.pinned = true;
      if (action === 'unpin') subject.pinned = false;
      if (action === 'lock') subject.locked = true;
      if (action === 'unlock') subject.locked = false;
      if (action === 'delete') mockData.subjects = mockData.subjects.filter((s) => s.id !== subjectId);
    }

    return Promise.resolve(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Forum - Récupérer les catégories
  if (url.includes('/api/forum/categories')) {
    return Promise.resolve(
      new Response(JSON.stringify(mockData.categories), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Auth - Récupérer l'utilisateur courant
  if (url.includes('/api/auth/me')) {
    return Promise.resolve(
      new Response(JSON.stringify(mockData.currentUser), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Forum - Récupérer les réponses d'un sujet
  if (url.match(/\/api\/forum\/subjects\/([^\/]+)\/replies$/)) {
    const subjectId = url.match(/subjects\/([^\/]+)/)[1];
    const replies = mockData.replies[subjectId] || [];
    return Promise.resolve(
      new Response(JSON.stringify(replies), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Forum - Ajouter une réponse
  if (url.match(/\/api\/forum\/subjects\/([^\/]+)\/replies$/) && options.method === 'POST') {
    const subjectId = url.match(/subjects\/([^\/]+)/)[1];
    const body = JSON.parse(options.body);
    
    const newReply = {
      id: 'r' + Date.now(),
      subjectId: subjectId,
      content: body.content,
      author: mockData.currentUser,
      likes: 0,
      helpfulCount: 0,
      likedByCurrentUser: false,
      markedAsHelpful: false,
      createdAt: new Date().toISOString(),
    };

    if (!mockData.replies[subjectId]) {
      mockData.replies[subjectId] = [];
    }
    mockData.replies[subjectId].push(newReply);

    return Promise.resolve(
      new Response(JSON.stringify(newReply), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Forum - Toggle like sur une réponse
  if (url.match(/\/api\/forum\/replies\/([^\/]+)\/like/)) {
    const replyId = url.match(/replies\/([^\/]+)/)[1];
    
    // Trouver la réponse dans tous les sujets
    let reply = null;
    for (const subjectId in mockData.replies) {
      const found = mockData.replies[subjectId].find(r => r.id === replyId);
      if (found) {
        reply = found;
        break;
      }
    }

    if (reply) {
      reply.likedByCurrentUser = !reply.likedByCurrentUser;
      reply.likes = (reply.likes || 0) + (reply.likedByCurrentUser ? 1 : -1);
    }

    return Promise.resolve(
      new Response(JSON.stringify({ liked: reply?.likedByCurrentUser, likes: reply?.likes }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Forum - Marquer une réponse comme utile (donne de l'XP)
  if (url.match(/\/api\/forum\/replies\/([^\/]+)\/helpful/)) {
    const replyId = url.match(/replies\/([^\/]+)/)[1];
    
    // Trouver la réponse
    let reply = null;
    for (const subjectId in mockData.replies) {
      const found = mockData.replies[subjectId].find(r => r.id === replyId);
      if (found) {
        reply = found;
        break;
      }
    }

    if (reply && !reply.markedAsHelpful) {
      reply.markedAsHelpful = true;
      reply.helpfulCount = (reply.helpfulCount || 0) + 1;
      
      return Promise.resolve(
        new Response(JSON.stringify({ 
          success: true, 
          author: reply.author.username,
          pointsEarned: 10 // Points XP gagnés
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    return Promise.resolve(
      new Response(JSON.stringify({ success: false, message: 'Déjà marqué comme utile' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }

  // Toutes les autres requêtes passent par le fetch original
  return originalFetch.apply(this, args);
};
