"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

interface Category {
  id: string;
  name: string;
  createdAt: any;
}

export default function EbcCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "duty_categories"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      setSaving(true);
      await addDoc(collection(db, "duty_categories"), {
        name: name.trim(),
        createdAt: serverTimestamp(),
      });
      setName("");
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteDoc(doc(db, "duty_categories", id));
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Duty Categories</h1>
          <p className="text-muted-foreground">Manage the tabs shown at the top of the EBC Flutter app.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add New Category Form */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Day Care" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Category
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Categories List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Active Categories (App Tabs)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border rounded-md">
                No categories created. The app will have no tabs.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => handleDelete(cat.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
