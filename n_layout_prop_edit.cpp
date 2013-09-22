#include "n_layout_prop_edit.h"
#include "ui_n_layout_prop_edit.h"

NLayoutPropEdit::NLayoutPropEdit(QWidget *parent) :
    QWidget(parent),
    ui(new Ui::NLayoutPropEdit)
{
    ui->setupUi(this);
}

NLayoutPropEdit::~NLayoutPropEdit()
{
    delete ui;
}
