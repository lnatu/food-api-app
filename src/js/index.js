import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Like';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likeView from './views/likeView';
import { elements, renderLoader, clearLoader } from './views/base';
import Like from './models/Like';

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */

const state = {};
window.state = state;

/**
 * SEARCH CONTROLLER
 */
const controllSearch = async () => {
    // 1. Get query from the view
    const query = searchView.getInput();

    if (query) {
        // 2. New search object and add to state
        state.search = new Search(query);

        // 3. Prepare UI for the results
        searchView.clearInput();
        searchView.clearResult();
        renderLoader(elements.searchWrapper);
        try {
            // 4. Search for recipes
            await state.search.getResults();  
    
            // 5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.recipes);
        } catch(err) {
            console.log(err);
            alert('Something went wrong with the search...');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controllSearch();
});


elements.searchResultPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResult();
        searchView.renderResults(state.search.recipes, goToPage);
    }
});

/**
 * RECIPE CONTROLLER
 */
const controllRecipe = async () => {
    const id = window.location.hash.replace('#', '');
    if (id) {
        // prepare ui for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        // highlight selected
        if (state.search) searchView.highlightSelected(id);
        // create new recipe object
        state.recipe = new Recipe(id);

        try {
            // get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
    
            // calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // render recipce
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLike(id));
        } catch (err) {
            alert('error processing recipe');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controllRecipe));

/**
 * LIST CONTROLLER
 */
const controlList = () => {
    // create a new list if there is none yet
    if (!state.list) {
        state.list = new List();
        
    }
    // add each ingredients to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

/**
 * LIKE CONTROLLER
 */
const controlLike = () => {
    if (!state.likes) state.likes = new Like();
    const currentId = state.recipe.id;

    if (!state.likes.isLike(currentId)) {
        const newLike = state.likes.addLike(currentId, state.recipe.title, state.recipe.author, state.recipe.image);
        likeView.toogleLike(true);
        likeView.renderLike(newLike);
    } else {
        state.likes.deleteLike(currentId);
        likeView.toogleLike(false);
        likeView.deleteLike(currentId);
    }
    likeView.likeMenu(state.likes.getLikes());
};

// Restore liked recipe when load
window.addEventListener('load', () => {
    state.likes = new Like();
    state.likes.readStorage();
    likeView.likeMenu(state.likes.getLikes());
    state.likes.likes.forEach(like => likeView.renderLike(like));
});


// handle delete and update item event
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.id;
    // handle the delete item
    if (e.target.matches('.shopping__delete, .shopping__delete * ')) {
        state.list.deleteItem(id);
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count--value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

// handling recipe buttons
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-descrease, .btn-descrease *')) {
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-inscrease, .btn-inscrease *')) {
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {    
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
});
window.l = new List();