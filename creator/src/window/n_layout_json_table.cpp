#include "n_layout_json_table.h"
#include "ui_n_layout_json_table.h"

NLayoutJSONTable::NLayoutJSONTable(QWidget *parent) : QDialog(parent), ui(new Ui::NLayoutJSONTable)
{
    ui->setupUi(this);

    connect(this->ui->okButton, SIGNAL(clicked()), this, SLOT(close()));
    connect(this->ui->cancelButton, SIGNAL(clicked()), this, SLOT(close()));
}

NLayoutJSONTable::~NLayoutJSONTable()
{
    delete ui;
}
