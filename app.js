"use strict";

const STORAGE_KEY = "kaibutsuScaleRecords";

document.addEventListener("DOMContentLoaded", function () {
  const weightInput = document.getElementById("weight");
  const customerInput = document.getElementById("customer");
  const amountElement = document.getElementById("calculated-amount");
  const selectedNameElement = document.getElementById("selected-name");
  const selectedPriceElement = document.getElementById("selected-price");
  const registerButton = document.getElementById("register-button");
  const clearButton = document.getElementById("clear-button");
  const recordList = document.getElementById("record-list");
  const emptyMessage = document.getElementById("empty-message");
  const totalWeightElement = document.getElementById("total-weight");
  const totalAmountElement = document.getElementById("total-amount");
  const categoryButtons =
    document.querySelectorAll(".category-button");

  let selectedName = "雑貨";
  let selectedPrice = 30;
  let records = loadRecords();

  function formatYen(value) {
    return Math.round(value).toLocaleString("ja-JP");
  }

  function calculateAmount() {
    const weight = parseFloat(weightInput.value);

    if (isNaN(weight) || weight <= 0) {
      amountElement.textContent = "0";
      return;
    }

    amountElement.textContent =
      formatYen(weight * selectedPrice);
  }

  function selectCategory(button) {
    categoryButtons.forEach(function (item) {
      item.classList.remove("selected");
    });

    button.classList.add("selected");

    selectedName = button.getAttribute("data-name");
    selectedPrice =
      Number(button.getAttribute("data-price"));

    selectedNameElement.textContent = selectedName;
    selectedPriceElement.textContent = selectedPrice;

    calculateAmount();
  }

  function loadRecords() {
    try {
      const savedData =
        localStorage.getItem(STORAGE_KEY);

      if (!savedData) {
        return [];
      }

      const parsedData = JSON.parse(savedData);

      if (Array.isArray(parsedData)) {
        return parsedData;
      }

      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function saveRecords() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(records)
    );
  }

  function createId() {
    return (
      String(Date.now()) +
      "-" +
      Math.random().toString(36).slice(2)
    );
  }

  function registerRecord() {
    const weight = parseFloat(weightInput.value);
    const customer = customerInput.value.trim();

    if (isNaN(weight) || weight <= 0) {
      alert("重量を入力してください。");
      weightInput.focus();
      return;
    }

    const record = {
      id: createId(),
      customer: customer,
      name: selectedName,
      weight: weight,
      price: selectedPrice,
      amount: Math.round(weight * selectedPrice),
      createdAt: new Date().toISOString()
    };

    records.unshift(record);
    saveRecords();
    renderRecords();

    weightInput.value = "";
    calculateAmount();
    weightInput.focus();

    alert("登録しました。");
  }

  function deleteRecord(id) {
    const confirmed =
      confirm("この明細を削除しますか？");

    if (!confirmed) {
      return;
    }

    records = records.filter(function (record) {
      return record.id !== id;
    });

    saveRecords();
    renderRecords();
  }

  function clearRecords() {
    if (records.length === 0) {
      return;
    }

    const confirmed =
      confirm("明細をすべて削除しますか？");

    if (!confirmed) {
      return;
    }

    records = [];
    saveRecords();
    renderRecords();
  }

  function renderRecords() {
    recordList.innerHTML = "";

    if (records.length === 0) {
      emptyMessage.style.display = "block";
    } else {
      emptyMessage.style.display = "none";
    }

    let totalWeight = 0;
    let totalAmount = 0;

    records.forEach(function (record) {
      totalWeight += Number(record.weight);
      totalAmount += Number(record.amount);

      const row = document.createElement("div");
      row.className = "record";

      const left = document.createElement("div");

      const name = document.createElement("div");
      name.className = "record-name";
      name.textContent = record.name;

      const details = document.createElement("div");
      details.className = "record-details";
      details.textContent =
        Number(record.weight).toFixed(2) +
        "kg × " +
        record.price +
        "円";

      left.appendChild(name);
      left.appendChild(details);

      if (record.customer) {
        const customer =
          document.createElement("div");

        customer.className = "record-details";
        customer.textContent = record.customer;

        left.appendChild(customer);
      }

      const right = document.createElement("div");

      const amount = document.createElement("div");
      amount.className = "record-amount";
      amount.textContent =
        formatYen(record.amount) + "円";

      const deleteButton =
        document.createElement("button");

      deleteButton.className = "delete-button";
      deleteButton.textContent = "削除";

      deleteButton.addEventListener(
        "click",
        function () {
          deleteRecord(record.id);
        }
      );

      right.appendChild(amount);
      right.appendChild(deleteButton);

      row.appendChild(left);
      row.appendChild(right);

      recordList.appendChild(row);
    });

    totalWeightElement.textContent =
      totalWeight.toFixed(2) + " kg";

    totalAmountElement.textContent =
      formatYen(totalAmount) + "円";
  }

  categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectCategory(button);
    });
  });

  weightInput.addEventListener(
    "input",
    calculateAmount
  );

  registerButton.addEventListener(
    "click",
    registerRecord
  );

  clearButton.addEventListener(
    "click",
    clearRecords
  );

  weightInput.addEventListener(
    "keydown",
    function (event) {
      if (event.key === "Enter") {
        registerRecord();
      }
    }
  );

  renderRecords();
});
