const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { predictDemand } = require("./prediction");


dotenv.config();

for (const name of ["SUPABASE_URL", "SUPABASE_SECRET_KEY"]) {
  const value = process.env[name] || "";
  const bad = [];

  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 127) {
      bad.push({ index: i, code: value.charCodeAt(i) });
    }
  }

  console.log(
    `[ENV CHECK] ${name}: length=${value.length}, nonASCII=${JSON.stringify(bad)}, whitespace=${/\s/.test(value)}`
  );
}


const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FoodWise AI backend is running"
  });
});

app.post("/api/predict", async (req, res) => {
  try {
    const {
      expectedPeople,
      isHoliday = false
    } = req.body;

    if (!expectedPeople || expectedPeople < 0) {
      return res.status(400).json({
        success: false,
        message: "expectedPeople is required"
      });
    }

    const { data, error } = await supabase
      .from("food_consumption")
      .select("food_consumed, expected_people")
      .order("date", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No historical food data found"
      });
    }

    const averageConsumption =
      data.reduce(
        (sum, row) => sum + Number(row.food_consumed),
        0
      ) / data.length;

    const historicalPeople =
      data.reduce(
        (sum, row) => sum + Number(row.expected_people),
        0
      ) / data.length;

    const prediction = predictDemand({
      averageConsumption,
      expectedPeople,
      historicalPeople,
      isHoliday
    });

    const { error: insertError } = await supabase
      .from("demand_predictions")
      .insert({
        prediction_date: new Date().toISOString().split("T")[0],
        expected_people: expectedPeople,
        is_holiday: isHoliday,
        predicted_demand: prediction.predictedDemand,
        recommended_preparation: prediction.recommendedPreparation,
        confidence: prediction.confidence
      });

    if (insertError) throw insertError;

    res.json({
      success: true,
      input: {
        expectedPeople,
        isHoliday
      },
      prediction
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


app.get("/api/analytics", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("food_consumption")
      .select(
        "id,date,day_of_week,is_holiday,expected_people,food_prepared,food_consumed,food_wasted"
      )
      .order("date", { ascending: false });

    if (error) throw error;

    const records = data || [];

    const totalPrepared = records.reduce(
      (sum, row) => sum + Number(row.food_prepared || 0),
      0
    );

    const totalConsumed = records.reduce(
      (sum, row) => sum + Number(row.food_consumed || 0),
      0
    );

    const totalWasted = records.reduce(
      (sum, row) => sum + Number(row.food_wasted || 0),
      0
    );

    const wastePercentage =
      totalPrepared > 0
        ? Number(((totalWasted / totalPrepared) * 100).toFixed(1))
        : 0;

    const foodSaved =
      totalPrepared > 0
        ? Number((totalPrepared - totalWasted).toFixed(1))
        : 0;

    res.json({
      success: true,
      analytics: {
        totalPrepared,
        totalConsumed,
        totalWasted,
        wastePercentage,
        foodSaved,
        recordCount: records.length,
        recentRecords: records.slice(0, 7)
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



app.post("/api/surplus", async (req, res) => {
  try {
    const {
      foodName,
      quantity,
      unit = "meals",
      pickupLocation,
      availableDate,
      sourceName,
      sourceType = "restaurant",
      organizationName = null,
      organizationType = null
    } = req.body;

    if (!foodName || !quantity || !pickupLocation || !availableDate || !sourceName) {
      return res.status(400).json({
        success: false,
        error: "foodName, quantity, pickupLocation, availableDate and sourceName are required"
      });
    }

    const { data, error } = await supabase
      .from("surplus_food")
      .insert([{
        food_name: foodName,
        quantity: Number(quantity),
        unit,
        pickup_location: pickupLocation,
        available_date: availableDate,
        source_name: sourceName,
        source_type: sourceType,
        organization_name: organizationName,
        organization_type: organizationType,
        pickup_status: "available"
      }])
      .select()
      .single();

    if (error) {
      console.error("Surplus insert error:", error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: "Surplus food registered successfully",
      listing: data
    });
  } catch (error) {
    console.error("Surplus POST error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to register surplus food"
    });
  }
});


app.patch("/api/surplus/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, organizationName } = req.body;

    const allowedStatuses = ["available", "reserved", "picked_up"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Use available, reserved or picked_up."
      });
    }

    const updateData = {
      pickup_status: status
    };

    if (organizationName) {
      updateData.organization_name = organizationName;
    }

    const { data, error } = await supabase
      .from("surplus_food")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Status update error:", error);

      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: `Surplus status updated to ${status}`,
      listing: data
    });
  } catch (error) {
    console.error("Surplus status error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to update surplus status"
    });
  }
});

app.get("/api/surplus", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("surplus_food")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const records = data || [];

    const availableMeals = records
      .filter(row => row.pickup_status === "available")
      .reduce((sum, row) => sum + Number(row.quantity || 0), 0);

    const redistributedMeals = records
      .filter(row => row.pickup_status === "picked_up")
      .reduce((sum, row) => sum + Number(row.quantity || 0), 0);

    res.json({
      success: true,
      summary: {
        availableMeals,
        redistributedMeals,
        totalListings: records.length
      },
      surplus: records
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`FoodWise AI server running on port ${PORT}`);
});
