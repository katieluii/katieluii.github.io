/*
  # Portfolio Projects Schema

  ## Overview
  Creates a comprehensive schema for storing data science, ML, and AI portfolio projects.

  ## New Tables
  
  ### `projects`
  - `id` (uuid, primary key) - Unique identifier for each project
  - `title` (text, required) - Project title
  - `description` (text, required) - Detailed project description
  - `category` (text, required) - Project category (Data Science, Machine Learning, AI, etc.)
  - `technologies` (text array) - List of technologies/tools used
  - `image_url` (text) - Main project image URL
  - `demo_url` (text) - Link to live demo
  - `github_url` (text) - Link to GitHub repository
  - `metrics` (jsonb) - Project metrics/results (accuracy, performance, etc.)
  - `featured` (boolean) - Whether to feature on homepage
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `projects` table
  - Allow public read access for portfolio viewing
  - Restrict write access (can be extended later for admin functionality)

  ## Notes
  1. Projects are publicly viewable to showcase portfolio
  2. Technologies stored as array for flexibility
  3. Metrics stored as JSONB for different project types
  4. Featured flag allows highlighting top projects
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  technologies text[] DEFAULT '{}',
  image_url text,
  demo_url text,
  github_url text,
  metrics jsonb DEFAULT '{}',
  featured boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(order_index);