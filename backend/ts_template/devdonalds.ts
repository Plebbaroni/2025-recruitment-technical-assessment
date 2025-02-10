import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

//So that cookTime can be updated during the recursive function in part 3
interface cookTimeObj {
  cookTime:number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: any = [];

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  let newRecipeName:string = "";

  for (const c of recipeName) {
    if ((newRecipeName.length === 0 || newRecipeName[newRecipeName.length-1] === ' ') && isAlpha(c)) {
      newRecipeName += c.toUpperCase();
    } else if (newRecipeName.length > 0 && (c === '-' || c === '_' || c === ' ') && newRecipeName[newRecipeName.length-1] !== ' ') {
      newRecipeName += ' ';
    } else if (isAlpha(c)){
      newRecipeName += c.toLowerCase();
    }
  }

  if (newRecipeName.length <= 0) {
    return null;
  }
  if (newRecipeName[newRecipeName.length-1] === ' ') {
    newRecipeName = newRecipeName.slice(0, -1)
  }
  return newRecipeName;
}
//HELPER FUNCTIONS FOR TASK 1

//Checks to see if the character is alphabetical
const isAlpha = (c:string): boolean => {
  if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
    return true;
  }

  return false;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  // TODO: implement me
  const recipe = req.body

  if (recipe.type !== "recipe" && recipe.type !== "ingredient") {
    res.status(400).send({"message": "Not a valid recipe type!"});
    return;
  } 
  if (recipe.cookTime < 0) {
    res.status(400).send({"message": "Cooktime must be greater than or equal to zero!"});
    return;
  }

  if (findRecipe(recipe.name) !== null) {
    res.status(400).send({"message": "Cookbook entry already exists!"});
    return;
  }

  if (recipe.type === "recipe" && !hasUniqueIngredients(recipe.requiredItems)) {
    res.status(400).send({"message":"Ingredients need to be unique!"});
    return;
  }

  cookbook.push(recipe);
  res.status(200).send({});
  return;

});

//TASK 2(and maybe 3) HELPER FUNCTIONS

//Finds and returns a recipe/ingredient if it exists, otherwise null
const findRecipe = (recipeName:string):ingredient|recipe|null => {
  for (const recipe of cookbook) {
    if (recipeName === recipe.name) {
      return recipe;
    }
  }
  return null;
}

//Checks to see if the required items array only contains unique ingredients
const hasUniqueIngredients = (requiredItems): boolean => {
  let dictionary: Map<string, number> = new Map();

  for (const item of requiredItems) {
    const count = getOrDefault(dictionary, item.name);
    if (count > 0) {
      return false;
    }
    dictionary.set(item.name, count+1);
  }
  return true;
}

//getOrDefault function that returns 0 if key doesn't exist
const getOrDefault = (dictionary:Map<string, number>, key:string):number => {
  const num = dictionary.get(key);
  if (num === undefined) {
    return 0;
  } 
  return num;
}
// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const recipeName = req.query.name;
  const recipe = findRecipe(recipeName);

  if (!recipe) {
    return res.status(400).send({"message":"recipe does not exist!"});
  }

  if ('cookTime' in recipe) {
    return res.status(400).send({"message":"ingredient name entered!"});
  }

  let dictionary: Map<string, number> = new Map()
  let cookTimeObj = {cookTime: 0}; 
  for (const item of recipe.requiredItems) {
    if (!getIngredients(dictionary, cookTimeObj, item)) {
      return res.status(400).send({"message":"Failed to find ingredient!"});
    }
  }

  
  return res.status(200).send({
    "name": recipeName,
    "cookTime":cookTimeObj.cookTime,
    "ingredients":Array.from(dictionary.entries())
  })

});

//HELPER FUNCTIONS FOR TASK 3
//Recursively adds ingredients, quantity, and cookTime to the dictionary, returning true if it was
//successful in finding the ingredients. Otherwise returns false.
const getIngredients = (dictionary:Map<string, number>, cookTimeObj:cookTimeObj, item:requiredItem):boolean => {
  const itemEntry = findRecipe(item.name);
  if (!itemEntry) {
    return false;
  }
  if ('cookTime' in itemEntry) {
    dictionary.set(item.name, getOrDefault(dictionary, item.name)+item.quantity);
    cookTimeObj.cookTime += item.quantity*itemEntry.cookTime;
  } else {
    for (const item of itemEntry.requiredItems) {
      if (!getIngredients(dictionary, cookTimeObj, item)) {
        return false;
      }
    }
  }
  return true;
}
// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
