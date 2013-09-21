#include "n_code_widget.h"
#include "ui_n_code_widget.h"

#include <QDebug>
#include <QTextEdit>

NCodeWidget::NCodeWidget(QWidget *parent) : NFileTabEditor(parent), ui(new Ui::NCodeWidget)
{
    ui->setupUi(this);
    mRootDirName = "code";
    mFileExtension = "js";
    mContextNewFileLabel = tr("&JavaScript");
    init(ui->fileTreeView, ui->fileTabWidget);
}

QString NCodeWidget::editedFileContent(QWidget *widget) {
    QTextEdit *edit = (QTextEdit *)widget;
    return edit->toPlainText();
}

QWidget *NCodeWidget::createTabWidget(const QString &filePath) {
    QFile file(filePath);

    if(!file.open(QFile::ReadOnly | QFile::Text)){
        return NULL;
    }

    QTextEdit *textEdit = new QTextEdit();
    textEdit->setText(file.readAll());
    file.close();

    connect(textEdit, SIGNAL(textChanged()), this, SLOT(updateTabForCurrentFileContentChanged()));

    return textEdit;
}

NCodeWidget::~NCodeWidget()
{
    delete ui;
}
