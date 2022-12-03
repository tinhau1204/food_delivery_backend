const { sequelize } = require("../services/common");
const { DataTypes, Op, QueryTypes } = require("sequelize");
const { orderDetail } = require("./order_detail");

const Order = sequelize.define(
  "order",
  {
    id: {
      type: DataTypes.STRING(25),
      primaryKey: true,
    },
    store_id: {
      type: DataTypes.STRING(25),
      allowNull: false,
      references: {
        model: "store",
        key: "id",
      },
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "account",
        key: "id",
      },
    },
    price: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    ship_fee: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(25),
      allowNull: false,
      references: {
        model: "status",
        key: "id",
      },
    },
  },
  {
    timestamps: false,
  }
);

async function insertOrder(id, store_id, account_id, price, ship_fee, payment_method, timestamp) {
  try {
    await Order.create({
      id: id,
      store_id: store_id,
      account_id: account_id,
      price: price,
      ship_fee: ship_fee,
      payment_method: payment_method,
      status: "received",
      timestamp: timestamp,
    });

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function getOrderByAccount(account_id, order_id) {
  return await Comment.findAll({
    where: {
      [Op.and]: [
        {
          account_id: {
            [Op.eq]: account_id,
          },
        },
        {
          id: {
            [Op.eq]: order_id,
          },
        },
      ],
    },
  });
}

async function getUserOrderList(account_id, status) {
  try {
    const data = await Order.findAll({
      include: {
        model: orderDetail,
        attributes: ["product_id", "quantity"],
      },
      where: {
        account_id: account_id,
        status: {
          [Op.like]: "%" + status + "%",
        },
      },
    });
    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function pendingOrder(id, account_id) {
  try {
    await Order.update({
      status: "pending",
      where: {
        id: id,
        account_id: account_id,
      },
    });

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function receiveOrder(id, account_id) {
  try {
    await Order.update({
      status: "done",
      where: {
        id: id,
        account_id: account_id,
      },
    });

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

async function checkNewOrders(store_id) {
  try {
    const data = await Order.findAll({
      attributes: ["id", "account_id", "price", "ship_fee", "timestamp", "payment_method", "status"],
      include: {
        model: orderDetail,
        attributes: ["product_id", "quantity"],
      },
      where: {
        status: "received",
        store_id: store_id,
      },
    });
    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function calculateTotal(store_id, mil1, mil2) {
  try {
    const data = await sequelize.query(
      "select sum(price*quantity) 'total_sum' from food_delivery.order o inner join order_detail od on o.id = od.order_id where o.id like '%S%" +
        store_id +
        "%O%' and (timestamp between " +
        mil1 +
        " and " +
        mil2 +
        ")",
      {
        type: QueryTypes.SELECT,
      }
    );
    return data;
  } catch (err) {
    console.log(err);
    return 0;
  }
}

async function calculateTotalWithLimit(store_id, limit, skip) {
  try {
    const data = await sequelize.query(
      "SELECT FROM_UNIXTIME(ord.timestamp/1000, '%Y-%m-%d') 'only_date', SUM(price + ship_fee * quantity ) 'total' FROM food_delivery.order ord " +
        "inner join order_detail od on ord.id = od.order_id " +
        "where store_id = '" +
        store_id +
        "' group by only_date order by only_date limit " +
        limit +
        " offset " +
        skip,
      {
        type: QueryTypes.SELECT,
      }
    );
    return data;
  } catch (err) {
    console.log(err);
    return 0;
  }
}

module.exports = {
  Order,
  insertOrder,
  getOrderByAccount,
  getUserOrderList,
  calculateTotal,
  checkNewOrders,
  pendingOrder,
  receiveOrder,
  calculateTotalWithLimit,
};
