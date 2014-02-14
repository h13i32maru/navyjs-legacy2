#include "n_layout_json_table.h"
#include "ui_n_layout_json_table.h"

#include <QLabel>
#include <QLineEdit>
#include <QModelIndex>
#include <QStandardItemModel>

#include <QDebug>

#include <plugin/view_plugin.h>

NLayoutJSONTable::NLayoutJSONTable(QWidget *parent) : QDialog(parent), ui(new Ui::NLayoutJSONTable)
{
    ui->setupUi(this);

    QStandardItemModel *model = new QStandardItemModel(0, 0);
    ui->tableView->setModel(model);

    connect(this->ui->okButton, SIGNAL(clicked()), this, SLOT(close()));
    connect(this->ui->cancelButton, SIGNAL(clicked()), this, SLOT(close()));
    connect(this->ui->addButton, SIGNAL(clicked()), this, SLOT(addRow()));

    connect(this->ui->tableView, SIGNAL(clicked(QModelIndex)), this, SLOT(showCellWidget(QModelIndex)));
}

void NLayoutJSONTable::addColumn(NJson widgetDefine) {
    QString label = widgetDefine.getStr("label");
    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();
    int count = ui->tableView->horizontalHeader()->count();
    model->setHorizontalHeaderItem(count, new QStandardItem(label));

    mWidgetDefines.append(widgetDefine);
}

void NLayoutJSONTable::addRow() {
    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();

    // 行を追加
    int rowCount = model->rowCount();
    model->setRowCount(rowCount + 1);
    int rowIndex = rowCount;

    for (int i = 0; i < model->columnCount(); i++) {
        model->setItem(rowIndex, i, new QStandardItem("hoge"));
    }
}

void NLayoutJSONTable::showCellWidget(const QModelIndex &modelIndex) {
    hideCurrentCellWidget();

    QWidget *widget = ViewPlugin::createWidget(mWidgetDefines[modelIndex.column()]);
    ui->tableView->setIndexWidget(modelIndex, widget);

    mCurrentShowIndex = modelIndex;
}

void NLayoutJSONTable::hideCurrentCellWidget() {
    if (!mCurrentShowIndex.isValid()) {
        return;
    }

//    // widgetが保持している値を文字列にエンコードしてラベルに保存する
//    QWidget *widget = ui->tableView->indexWidget(mCurrentShowIndex);
//    QString value = ViewPlugin::encodeValue(widget);

//    QStandardItemModel *model = (QStandardItemModel *)ui->tableView->model();
//    QStandardItem *item = model->item(mCurrentShowIndex.row(), mCurrentShowIndex.column());

//    item->setText(value);
//    // --

//    // widgetを削除
//    ui->tableView->setIndexWidget(mCurrentShowIndex, NULL);
}

NLayoutJSONTable::~NLayoutJSONTable()
{
    delete ui;
}
