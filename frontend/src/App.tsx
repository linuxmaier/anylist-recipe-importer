import React, { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, Plus, ArrowLeft, Save, Loader2, ChefHat } from 'lucide-react';
import type { Recipe, Collection, ApiScanResponse, ApiCollectionResponse } from './types';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

function App() {
  // State
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch collections on mount
  useEffect(() => {
    fetch(`${API_BASE}/debug-collections`)
      .then(res => res.json())
      .then((data: ApiCollectionResponse) => {
        if (data.success) {
          setCollections(data.collections);
          // Default to "Main Dishes" if found
          const mainDishes = data.collections.find(c => c.name.toLowerCase().includes('main dishes'));
          if (mainDishes) setSelectedCollection(mainDishes.id);
        }
      })
      .catch(err => console.error("Failed to load collections:", err));
  }, []);

  // Handle File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Start upload/scan
    await scanRecipe(file);
  };

  const scanRecipe = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE}/scan-recipe`, {
        method: 'POST',
        body: formData,
      });

      const data: ApiScanResponse = await response.json();

      if (data.success && data.recipe) {
        setRecipe(data.recipe);
        setStep('review');
      } else {
        setError(data.error || 'Failed to scan recipe');
      }
    } catch (err) {
      setError('Connection to backend failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const saveToAnyList = async () => {
    if (!recipe) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/create-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recipe,
          collectionId: selectedCollection
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Recipe saved to AnyList!');
        // Reset after 3 seconds
        setTimeout(() => {
          setStep('upload');
          setRecipe(null);
          setPreviewUrl(null);
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.error || 'Failed to save to AnyList');
      }
    } catch (err) {
      setError('Failed to reach the AnyList server');
    } finally {
      setLoading(false);
    }
  };

  // Helper to update recipe fields
  const updateRecipe = (field: keyof Recipe, value: any) => {
    if (!recipe) return;
    setRecipe({ ...recipe, [field]: value });
  };

  const handleArrayChange = (field: 'ingredients' | 'instructions', index: number, value: string) => {
    if (!recipe) return;
    const newList = [...recipe[field]];
    newList[index] = value;
    updateRecipe(field, newList);
  };

  const addListItem = (field: 'ingredients' | 'instructions') => {
    if (!recipe) return;
    updateRecipe(field, [...recipe[field], '']);
  };

  const removeListItem = (field: 'ingredients' | 'instructions', index: number) => {
    if (!recipe) return;
    const newList = recipe[field].filter((_, i) => i !== index);
    updateRecipe(field, newList);
  };

  return (
    <div className="container">
      <header>
        <h1><ChefHat size={32} /> AnyList Importer</h1>
      </header>

      {error && <div className="status-message status-error">{error}</div>}
      {success && <div className="status-message status-success">{success}</div>}

      {step === 'upload' ? (
        <div className="card">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            ref={fileInputRef} 
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
            <Camera size={48} className="upload-icon" />
            <h3>Snap or Upload a Recipe</h3>
            <p>Take a photo of a cookbook page to begin</p>
          </div>

          {loading && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <div className="spinner"></div>
              <p>Gemini is reading your recipe...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <button className="btn-secondary" onClick={() => setStep('upload')} style={{ marginBottom: 15 }}>
            <ArrowLeft size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Back
          </button>

          {previewUrl && <img src={previewUrl} alt="Preview" className="image-preview" />}

          <div className="form-group">
            <label className="form-label">Recipe Title</label>
            <input 
              className="form-input" 
              value={recipe?.name || ''} 
              onChange={(e) => updateRecipe('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category (AnyList Collection)</label>
            <select 
              className="form-input"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <option value="">Uncategorized</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ingredients</label>
            <div className="list-editor">
              {recipe?.ingredients.map((ing, i) => (
                <div key={i} className="list-item-row">
                  <input 
                    className="form-input" 
                    value={ing} 
                    onChange={(e) => handleArrayChange('ingredients', i, e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeListItem('ingredients', i)}><Trash2 size={18} /></button>
                </div>
              ))}
              <button className="add-btn" onClick={() => addListItem('ingredients')}><Plus size={18} /> Add Ingredient</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Instructions</label>
            <div className="list-editor">
              {recipe?.instructions.map((step, i) => (
                <div key={i} className="list-item-row">
                  <textarea 
                    className="form-textarea" 
                    value={step} 
                    onChange={(e) => handleArrayChange('instructions', i, e.target.value)}
                  />
                  <button className="remove-btn" onClick={() => removeListItem('instructions', i)}><Trash2 size={18} /></button>
                </div>
              ))}
              <button className="add-btn" onClick={() => addListItem('instructions')}><Plus size={18} /> Add Step</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Substitutions</label>
            <textarea 
              className="form-textarea" 
              value={recipe?.notes || ''} 
              onChange={(e) => updateRecipe('notes', e.target.value)}
            />
          </div>

          <button 
            className="btn-primary" 
            disabled={loading} 
            onClick={saveToAnyList}
          >
            {loading ? <Loader2 className="spinner" /> : <Save size={20} />}
            {loading ? 'Saving...' : 'Save to AnyList'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;