const getIngredients = async () => {
    const res = await fetch(
        'https://www.themealdb.com/api/json/v1/1/list.php?i=list'
    );
    const data = await res.json();

    return data.meals;
    // don't know why the API sends stuff in the "meals" property for some reason 😭
};

const getIngredientNamesAndIDs = (ingredientsData) =>
    ingredientsData.map((datapoint) => {
        return {
            name: datapoint.strIngredient,
            nameLower: datapoint.strIngredient.toLowerCase(),
            id: datapoint.idIngredient
        };
    });

const updateLocalStorage = (updatedIngredients, ingredientNamesAndIDs) => {
    if (updatedIngredients.length === 0) {
        localStorage.clear();
        updatePantryIngredients(updatedIngredients, ingredientNamesAndIDs);
        return;
    }
    localStorage.setItem('ingredients', JSON.stringify(updatedIngredients));

    updatePantryIngredients(updatedIngredients, ingredientNamesAndIDs);
};

const readLocalStorage = () => {
    if (localStorage.length == 0) return null;

    return JSON.parse(localStorage.getItem('ingredients'));
};

const getImageURL = (name) => {
    return `https://www.themealdb.com/images/ingredients/${getURLName(
        name
    )}.png`;
};

const getURLName = (name) => {
    name = name.toLowerCase();
    return name.replace(/ /g, '_');
};

const updatePantryIngredients = (ingredientIDs, ingredientNamesAndIDs) => {
    const pantryElementsContainer = document.querySelector('div.pantry-items');
    pantryElementsContainer.replaceChildren([]);

    const parentElement = pantryElementsContainer.parentElement;

    // dynamic spacing between searchbar and items
    const searchBarContainer = document.querySelector(
        'div:has(input#pantry-input[type="text"])'
    );
    searchBarContainer.classList.remove('mb-5');
    pantryElementsContainer.classList.remove('mb-5');

    if (parentElement.children.length === 4) {
        parentElement.removeChild(parentElement.children.item(3));
    }

    if (ingredientIDs.length > 0) {
        searchBarContainer.classList.add('mb-5');
        pantryElementsContainer.classList.add('mb-5');
    } else {
        updateRecipes([]);
        return;
    }

    for (let i = 0; i < ingredientIDs.length; i++) {
        const ingredient = ingredientNamesAndIDs.find(
            (elem) => elem.id === ingredientIDs[i]
        );

        const mainElement = document.createElement('div');
        mainElement.classList.add('pantry-item');

        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.classList.add('pantry-item-thumbnail');

        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = getImageURL(ingredient.name);
        thumbnailImg.classList.add('w-4/5');
        thumbnailImg.classList.add('aspect-square');

        thumbnailDiv.appendChild(thumbnailImg);

        const nameElement = document.createElement('div');
        nameElement.classList.add('pantry-item-name');
        nameElement.innerText = ingredient.name.toUpperCase();

        const svgCancelElement = document.createElement('div');
        svgCancelElement.classList.add('pantry-item-cancel-button');
        svgCancelElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" class="fill-red-500 scale-200"
        ><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
        </svg>`;
        // too much work to make an SVG element and stuff

        svgCancelElement.addEventListener('click', () => {
            // since JS doesn't have a `.remove` function or similar, we are going to have to maneuver around it
            const temp = [];

            while (ingredientIDs.length > i + 1) {
                temp.push(ingredientIDs.pop());
            }

            ingredientIDs.pop();

            while (temp.length > 0) {
                ingredientIDs.push(temp.pop());
            }
            // essentially we have deleted the element at the index `i` without making a copy of the array

            updateLocalStorage(ingredientIDs, ingredientNamesAndIDs);
        });

        mainElement.appendChild(thumbnailDiv);
        mainElement.appendChild(nameElement);
        mainElement.appendChild(svgCancelElement);

        pantryElementsContainer.appendChild(mainElement);
    }

    // add a button that filters recipes and shows
    const button = document.createElement('button');
    button.className =
        'bg-gray-700 h-20 w-full justify-center items-center flex cursor-pointer hover:bg-green-300';
    button.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            class="fill-green-500"
        >
            <path
                d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"
            />
        </svg>
    `;

    parentElement.appendChild(button);
    button.addEventListener('click', async () => {
        const recipes = [];
        const recipeIDs = [];

        for (const id of ingredientIDs) {
            const ingredient = ingredientNamesAndIDs.find(
                (elem) => elem.id === id
            );

            const res = await fetch(
                `https://www.themealdb.com/api/json/v1/1/filter.php?i=${getURLName(
                    ingredient.name
                )}`
            );
            const data = await res.json();

            const meals = data.meals;

            for (const meal of meals) {
                if (meal.idMeal in recipeIDs) continue;

                recipeIDs.push(meal.idMeal);
                recipes.push(meal);
            }
        }

        updateRecipes(recipes);
    });
};

const updateRecipes = (recipes) => {
    const container = document.querySelector('div.recipes-container');
    container.replaceChildren([]);

    for (const recipe of recipes) {
        const name =
            recipe.strMeal.length <= 20
                ? recipe.strMeal
                : recipe.strMeal.slice(0, 17) + '...';
        const thumbnailURL = recipe.strMealThumb;
        const id = recipe.idMeal;

        const mainElement = document.createElement('div');
        mainElement.classList.add('recipe');

        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.classList.add('recipe-thumbnail');

        const thumbnailImg = document.createElement('img');
        thumbnailImg.classList.add('recipe-thumbnail-image');
        thumbnailImg.src = thumbnailURL;

        thumbnailDiv.appendChild(thumbnailImg);

        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('recipe-details');
        detailsDiv.innerText = name;

        detailsDiv.addEventListener('click', async () => {
            const res = await fetch(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
            );
            const data = await res.json();
            const link = data.meals[0].strYoutube;

            window.location = link;
        });

        mainElement.appendChild(thumbnailDiv);
        mainElement.appendChild(detailsDiv);

        container.appendChild(mainElement);
    }
};

async function main() {
    const ingredientsData = await getIngredients();
    const ingredientNamesAndIDs = getIngredientNamesAndIDs(ingredientsData);

    // in case there's already some stuff there
    const pantry = readLocalStorage() || [];
    updatePantryIngredients(pantry, ingredientNamesAndIDs);

    const input = document.querySelector('input#pantry-input[type="text"]');
    const autocompleteElement = input.parentElement.children[1];

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        const matches = ingredientNamesAndIDs.filter(
            ({ nameLower, id }) =>
                nameLower.includes(query) && !pantry.includes(id)
        );

        autocompleteElement.replaceChildren([]);

        if (!query) return;

        for (const match of matches) {
            const elem = document.createElement('div');

            elem.classList.add('autocomplete-item');
            elem.innerText = match.name;

            elem.addEventListener('click', () => {
                pantry.push(match.id);
                updateLocalStorage(pantry, ingredientNamesAndIDs);

                input.value = '';

                autocompleteElement.replaceChildren([]);
                input.focus();
            });

            autocompleteElement.appendChild(elem);
        }
    });
}

main();
