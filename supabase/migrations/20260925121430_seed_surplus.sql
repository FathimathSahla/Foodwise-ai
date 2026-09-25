insert into public.surplus_food
(food_name, quantity, unit, pickup_location, available_date, source_name, source_type, organization_name, organization_type, pickup_status, distance_km)
values
('Rice Meals', 35, 'meals', 'Green Leaf Cafeteria', current_date, 'Green Leaf Cafeteria', 'cafeteria', 'Hope Food Foundation', 'NGO', 'available', 2.4),
('Vegetable Curry', 18, 'meals', 'Green Leaf Cafeteria', current_date, 'Green Leaf Cafeteria', 'cafeteria', 'Care Community Kitchen', 'community kitchen', 'reserved', 3.1),
('Chapati', 42, 'meals', 'Campus Kitchen', current_date, 'Campus Kitchen', 'hostel', 'Hope Food Foundation', 'NGO', 'available', 1.8);
