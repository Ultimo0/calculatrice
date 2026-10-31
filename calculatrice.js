// =====================================================================
// CALCULATRICE : calculatrice.js
// Organisation du fichier :
//   1. Le cerveau        : les fonctions de calcul de base
//   2. Les éléments      : ce qu'on récupère dans la page
//   3. La mémoire        : les variables qui retiennent l'état
//   4. L'affichage       : les fonctions qui modifient l'écran
//   5. Le calcul complet : évaluer une expression avec les priorités
//   6. Les actions       : ce qui se passe quand on appuie sur une touche
//   7. Les événements    : le branchement des clics et du clavier
// =====================================================================


// ---------------------------------------------------------------------
// 1. LE CERVEAU : les fonctions de calcul de base (inchangées)
// ---------------------------------------------------------------------

function addition(a, b) {
    return a + b;
}

function soustraction(a, b) {
    return a - b;
}

function multiplication(a, b) {
    return a * b;
}

function division(a, b) {
    if (b === 0) {
        return "Erreur : division par zéro";   // un TEXTE : c'est ainsi qu'on repère une erreur
    }
    return a / b;
}

// Choisit la bonne opération selon le signe reçu ("+", "-", "*" ou "/")
function calculer(a, operateur, b) {
    if (operateur === "+") {
        return addition(a, b);
    } else if (operateur === "-") {
        return soustraction(a, b);
    } else if (operateur === "*") {
        return multiplication(a, b);
    } else if (operateur === "/") {
        return division(a, b);
    } else {
        return "Opérateur inconnu";
    }
}


// ---------------------------------------------------------------------
// 2. LES ÉLÉMENTS DE LA PAGE
// ---------------------------------------------------------------------

const valeurEcran = document.getElementById("ecran");          // ligne du bas : le nombre
const operationEcran = document.getElementById("operation");   // ligne du haut : l'expression en cours
const touches = document.querySelectorAll(".touche");          // tous les boutons (classe "touche")


// ---------------------------------------------------------------------
// 3. LA MÉMOIRE DU PROGRAMME
// ---------------------------------------------------------------------

// Une constante écrite en MAJUSCULES : réglage fixe du programme.
// Nombre maximum de caractères qu'on peut taper pour un nombre.
const LONGUEUR_MAX = 12;

let saisie = "0";              // le nombre en cours de frappe (sous forme de texte)
let nombreTape = false;        // a-t-on tapé un nombre depuis le dernier opérateur ?
let resultatAffiche = false;   // l'écran montre-t-il un nombre calculé (résultat ou pourcentage) ?

// NOUVEAU : toute l'expression en cours, dans un TABLEAU.
// Il alterne des nombres et des signes. Exemple pour "2 + 3 ×" :
//     [2, "+", 3, "*"]
// Les nombres sont de vrais nombres (type "number"), les signes sont des textes.
let expression = [];


// ---------------------------------------------------------------------
// 4. L'AFFICHAGE
// ---------------------------------------------------------------------

// Transforme un signe du programme en symbole joli pour l'écran
function symbole(signe) {
    if (signe === "/") {
        return "÷";
    } else if (signe === "*") {
        return "×";
    } else if (signe === "-") {
        return "−";
    } else {
        return signe;
    }
}

// Transforme un nombre en texte propre.
// En JavaScript, 0.1 + 0.2 donne 0.30000000000000004 à cause de la façon dont
// les ordinateurs stockent les décimales. toPrecision(15) garde 15 chiffres
// significatifs, et Number(...) supprime les zéros inutiles : "0.300000000000000" devient 0.3.
function formater(nombre) {
    return String(Number(nombre.toPrecision(15)));
}

// NOUVEAU : transforme un tableau d'expression en texte lisible.
// [2, "+", 3, "*"]  devient  "2 + 3 ×"
function texteExpression(liste) {
    const morceaux = [];

    for (let i = 0; i < liste.length; i++) {
        // typeof permet de distinguer un nombre d'un signe (qui est un texte)
        if (typeof liste[i] === "number") {
            morceaux.push(formater(liste[i]));
        } else {
            morceaux.push(symbole(liste[i]));
        }
    }

    // join(" ") : colle tous les morceaux du tableau en un seul texte, séparés par un espace
    return morceaux.join(" ");
}

// Affiche un texte sur la ligne principale de l'écran
function afficher(texte) {
    valeurEcran.textContent = texte;
    // classList.toggle("long", condition) : ajoute la classe "long" si la condition est vraie,
    // la retire sinon. Le CSS réduit alors la taille du texte.
    valeurEcran.classList.toggle("long", texte.length > 9);
}

// Affiche l'expression en cours sur la ligne du haut
function majOperation() {
    operationEcran.textContent = texteExpression(expression);
}

// Remet TOUTE la mémoire et l'écran à zéro (utilisée par "C" et par les erreurs)
function reinitialiser() {
    saisie = "0";
    expression = [];
    nombreTape = false;
    resultatAffiche = false;
    operationEcran.textContent = "";
    afficher("0");
}

// Affiche un message d'erreur, après avoir vidé la mémoire
// (pour que le texte de l'erreur ne soit jamais réutilisé dans un calcul)
function afficherErreur(message) {
    reinitialiser();
    afficher(message);
}


// ---------------------------------------------------------------------
// 5. LE CALCUL COMPLET : les priorités des opérations
// ---------------------------------------------------------------------

// Reçoit une expression COMPLÈTE (qui commence et finit par un nombre)
// et retourne le résultat, ou un texte si une erreur survient.
// Exemple : evaluer([2, "+", 3, "*", 4]) retourne 14, et non 20.
//
// Le calcul se fait en DEUX PASSES :
//   passe 1 : on calcule d'abord les × et ÷  ([2, "+", 3, "*", 4] devient [2, "+", 12])
//   passe 2 : on calcule ensuite les + et −   ([2, "+", 12] devient 14)
function evaluer(elements) {

    // ----- PASSE 1 : les multiplications et les divisions -----
    // On construit un nouveau tableau, en partant du premier nombre.
    const apresPasse1 = [elements[0]];

    // On avance de 2 en 2 : à chaque tour, on lit un SIGNE (position i)
    // et le NOMBRE qui le suit (position i + 1).
    for (let i = 1; i < elements.length; i += 2) {
        const signe = elements[i];
        const nombre = elements[i + 1];

        if (signe === "*" || signe === "/") {
            // pop() retire le DERNIER élément du tableau et le retourne :
            // c'est le nombre qui se trouve à gauche du signe.
            const gauche = apresPasse1.pop();
            const resultat = calculer(gauche, signe, nombre);

            if (typeof resultat === "string") {
                return resultat;              // une erreur (division par zéro) : on s'arrête là
            }
            apresPasse1.push(resultat);       // le résultat remplace "gauche signe nombre"

        } else {
            // + ou − : on ne calcule pas encore, on recopie tel quel pour la passe 2
            apresPasse1.push(signe);
            apresPasse1.push(nombre);
        }
    }

    // ----- PASSE 2 : les additions et les soustractions, de gauche à droite -----
    let total = apresPasse1[0];

    for (let i = 1; i < apresPasse1.length; i += 2) {
        total = calculer(total, apresPasse1[i], apresPasse1[i + 1]);
    }

    return total;
}


// ---------------------------------------------------------------------
// 6. LES ACTIONS : ce qui se passe quand on appuie sur une touche
// ---------------------------------------------------------------------

// Un chiffre (de "0" à "9")
function appuyerChiffre(chiffre) {
    if (resultatAffiche) {
        // Un nombre calculé est affiché : taper un chiffre démarre un NOUVEAU nombre
        saisie = chiffre;
        resultatAffiche = false;
        majOperation();       // après un "=", l'expression est vide : la ligne du haut s'efface
    } else if (saisie === "0") {
        saisie = chiffre;                 // on remplace le 0 du départ (pas de "07")
    } else if (saisie.length < LONGUEUR_MAX) {
        saisie += chiffre;                // on colle le chiffre à la suite
    }
    // (si le nombre est déjà trop long, on ignore le chiffre)
    nombreTape = true;
    afficher(saisie);
}

// Le point décimal
function appuyerPoint() {
    if (resultatAffiche) {
        saisie = "0.";                    // on repart d'un nouveau nombre : "0."
        resultatAffiche = false;
        majOperation();
    } else if (!saisie.includes(".") && saisie.length < LONGUEUR_MAX) {
        // includes(".") : le texte contient-il déjà un point ?
        // On n'ajoute le point que s'il n'y en a pas encore (pas de "3.5.2")
        saisie += ".";
    }
    nombreTape = true;
    afficher(saisie);
}

// NOUVEAU : le pourcentage (option A : on divise le nombre affiché par 100)
function appuyerPourcent() {
    if (!nombreTape) {
        return;                           // aucun nombre à transformer : on ne fait rien
    }
    saisie = formater(Number(saisie) / 100);
    resultatAffiche = true;               // ce nombre est calculé, pas tapé : un chiffre le remplacera
    afficher(saisie);
}

// Un opérateur ("+", "-", "*" ou "/")
function appuyerOperateur(signe) {
    if (!nombreTape && expression.length > 0) {
        // Aucun nombre tapé depuis le dernier signe : l'utilisateur change d'avis.
        // On remplace seulement le dernier signe du tableau, sans rien calculer.
        expression[expression.length - 1] = signe;

    } else {
        // On range le nombre tapé, puis le signe, à la fin du tableau.
        // Après un "=", saisie contient encore le résultat : il est donc réutilisé.
        expression.push(Number(saisie));
        expression.push(signe);
        saisie = "0";
        nombreTape = false;
        resultatAffiche = false;
    }

    majOperation();
}

// Le signe égal
function appuyerEgal() {
    if (expression.length === 0) {
        return;                           // rien en attente : on ne fait rien
    }

    // slice() sans argument fait une COPIE du tableau : on ne modifie pas l'original
    const complete = expression.slice();

    if (nombreTape) {
        complete.push(Number(saisie));    // on ajoute le dernier nombre tapé
    } else {
        complete.pop();                   // l'expression finit par un signe : on le retire
    }

    const resultat = evaluer(complete);

    if (typeof resultat === "string") {
        afficherErreur(resultat);         // erreur : on repart de zéro
        return;
    }

    // Ligne du haut : l'expression complète, suivie de "=" (ex : "2 + 3 × 4 =")
    operationEcran.textContent = texteExpression(complete) + " =";

    // On GARDE le résultat dans saisie, pour pouvoir l'utiliser dans le calcul suivant
    saisie = formater(resultat);
    afficher(saisie);

    expression = [];                      // le calcul est terminé : on vide le tableau
    nombreTape = true;                    // le résultat compte comme un nombre disponible
    resultatAffiche = true;
}

// La touche C : tout effacer
function effacerTout() {
    reinitialiser();
}

// La touche ⌫ : effacer le dernier chiffre tapé
function effacerDernier() {
    if (resultatAffiche || !nombreTape) {
        return;                           // rien à effacer (nombre calculé, ou aucun nombre en cours)
    }
    saisie = saisie.slice(0, -1);         // slice(0, -1) : tout le texte sauf le dernier caractère
    if (saisie === "" || saisie === "-") {
        saisie = "0";
    }
    afficher(saisie);
}


// ---------------------------------------------------------------------
// 7. LES ÉVÉNEMENTS : brancher la souris et le clavier
// ---------------------------------------------------------------------

// --- La souris : un écouteur de clic sur chaque touche ---
for (let i = 0; i < touches.length; i++) {
    touches[i].addEventListener("click", function () {
        // dataset donne accès aux attributs "data-" du bouton :
        // data-chiffre="7" devient donnees.chiffre, qui vaut "7".
        // Si le bouton n'a pas cet attribut, la valeur est undefined (leçon 3).
        const donnees = touches[i].dataset;

        if (donnees.chiffre !== undefined) {
            appuyerChiffre(donnees.chiffre);
        } else if (donnees.operateur !== undefined) {
            appuyerOperateur(donnees.operateur);
        } else if (donnees.action === "point") {
            appuyerPoint();
        } else if (donnees.action === "pourcent") {
            appuyerPourcent();
        } else if (donnees.action === "egal") {
            appuyerEgal();
        } else if (donnees.action === "retour") {
            effacerDernier();
        } else if (donnees.action === "effacer") {
            effacerTout();
        }
    });
}

// --- Le clavier : un écouteur sur toute la page ---
// "keydown" : une touche du clavier vient d'être enfoncée.
// evenement.key contient le nom de la touche : "5", "+", "Enter", "Backspace", "Escape"...
document.addEventListener("keydown", function (evenement) {
    // On laisse tranquilles les raccourcis (Ctrl+C, Ctrl+V...)
    if (evenement.ctrlKey || evenement.metaKey || evenement.altKey) {
        return;
    }

    const touche = evenement.key;

    if (touche.length === 1 && touche >= "0" && touche <= "9") {
        // un seul caractère, compris entre "0" et "9" : c'est un chiffre
        appuyerChiffre(touche);
    } else if (touche === "." || touche === ",") {
        appuyerPoint();
    } else if (touche === "%") {
        appuyerPourcent();
    } else if (touche === "+" || touche === "-" || touche === "*" || touche === "/") {
        // preventDefault() : empêche le navigateur de réagir à sa façon
        // (par exemple "/" ouvre la recherche rapide dans Firefox)
        evenement.preventDefault();
        appuyerOperateur(touche);
    } else if (touche === "Enter" || touche === "=") {
        // Sans preventDefault, "Entrée" re-cliquerait sur le dernier bouton utilisé à la souris
        evenement.preventDefault();
        appuyerEgal();
    } else if (touche === "Backspace") {
        effacerDernier();
    } else if (touche === "Escape") {
        effacerTout();
    }
});