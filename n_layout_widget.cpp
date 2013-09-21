#include "n_layout_widget.h"
#include "ui_n_layout_widget.h"

NLayoutWidget::NLayoutWidget(QWidget *parent) : NFileTabEditor(parent), ui(new Ui::NLayoutWidget)
{
    ui->setupUi(this);

    mRootDirName = "layout";
    mFileExtension = "json";
    mImportFileExtension = "Text (*.json)";
    mContextNewFileLabel = tr("&JSON");

    init(ui->fileTreeView, ui->fileTabWidget);
}

QWidget *NLayoutWidget::createTabWidget(const QString &filePath) {
    QLabel *label = new QLabel();
    label->setText(filePath);
    label->setAlignment(Qt::AlignCenter);
    label->setStyleSheet("QLabel { background: #ffffff; }");

    return label;
}

QString NLayoutWidget::editedFileContent(QWidget* /* widget */) {
    return NULL;
}


NLayoutWidget::~NLayoutWidget()
{
    delete ui;
}
